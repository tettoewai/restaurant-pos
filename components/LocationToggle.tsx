"use client";
import { updateSelectLocation } from "@/app/lib/backoffice/action";
import {
  fetchLocation,
  fetchSelectedLocation,
} from "@/app/lib/backoffice/data";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import { AltArrowDown, MapPoint } from "@solar-icons/react/ssr";
import React, { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

export default function LocationToggle() {
  // Use state to prevent hydration mismatch with localStorage
  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize localStorage value after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
  }, []);

  // Include isUpdateLocation in SWR key to trigger revalidation when it changes
  const { data, isLoading } = useSWR(
    mounted ? ["location", "selectedLocation", isUpdateLocation] : null,
    async () => {
      const [location, selectedLocation] = await Promise.all([
        fetchLocation(),
        fetchSelectedLocation(),
      ]);
      return { location, selectedLocation };
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const [selectedKey, setSelectedKey] = useState<Set<string>>(new Set([]));

  // Update selectedKey when data is loaded
  useEffect(() => {
    if (data?.selectedLocation) {
      setSelectedKey(new Set([String(data.selectedLocation.locationId)]));
    }
  }, [data?.selectedLocation]);

  const handleSelectChange = async (keys: any) => {
    if (!keys || (typeof keys === "object" && keys.size === 0)) return;

    const keysArray = typeof keys === "string" ? [keys] : Array.from(keys);
    const locationId = Number(keysArray[0]);
    if (!locationId || isNaN(locationId)) return;

    setSelectedKey(new Set([String(locationId)]));

    try {
      await updateSelectLocation(locationId);

      // Toggle localStorage value to trigger revalidation
      const newValue = isUpdateLocation === "false" ? "true" : "false";
      localStorage.setItem("isUpdateLocation", newValue);
      setIsUpdateLocation(newValue);

      // Manually revalidate related SWR caches
      mutate(["location", "selectedLocation", isUpdateLocation]);
      mutate(["location", "selectedLocation", newValue]);
    } catch (error) {
      console.error("Error updating selected location:", error);
      // Revert selection on error
      if (data?.selectedLocation) {
        setSelectedKey(new Set([String(data.selectedLocation.locationId)]));
      }
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="flat"
        className="bg-background p-0"
        startContent={<MapPoint className="text-primary" />}
        endContent={<AltArrowDown className="text-primary" />}
        isDisabled
      >
        <p className="truncate">Loading...</p>
      </Button>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button
        variant="flat"
        className="bg-background p-0"
        startContent={<MapPoint className="text-primary" />}
        isDisabled
      >
        <Spinner size="sm" variant="wave" />
      </Button>
    );
  }

  // Don't show if no data or less than 2 locations (no need to toggle)
  if (
    !data ||
    !data.location ||
    data.location.length < 2 ||
    !data.selectedLocation
  ) {
    return null;
  }

  const selectedLocationId =
    Number(Array.from(selectedKey)[0]) || data.selectedLocation.locationId;

  const selectedLocationName =
    data.location.find((item) => item.id === selectedLocationId)?.name ||
    data.location.find(
      (item) => item.id === data.selectedLocation?.locationId || 0
    )?.name ||
    "Unknown";

  return (
    <Dropdown className="bg-background">
      <DropdownTrigger>
        <Button
          variant="flat"
          className="bg-background p-0"
          startContent={<MapPoint className="text-primary" />}
          endContent={<AltArrowDown className="text-primary" />}
        >
          <p className="truncate">{selectedLocationName}</p>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="location select"
        variant="flat"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={selectedKey}
        onSelectionChange={handleSelectChange}
      >
        {data.location.map((item) => (
          <DropdownItem key={item.id.toString()}>{item.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
