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
import React, { useEffect } from "react";
import useSWR from "swr";

export default function Locationtoggle() {
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;

  const { data, isLoading } = useSWR(
    ["location", "selectedLocation"],
    async () => {
      const [location, selectedLocation] = await Promise.all([
        fetchLocation(),
        fetchSelectedLocation(),
      ]);
      return { location, selectedLocation };
    }
  );

  const [selectedKey, setSelectedKey] = React.useState<Set<string>>(
    new Set([])
  );

  useEffect(() => {
    if (data && data.selectedLocation) {
      setSelectedKey(new Set(String(data.selectedLocation.locationId)));
    }
  }, [data, data?.selectedLocation]);

  const handleSelectChange = async (e: any) => {
    setSelectedKey(e);
    await updateSelectLocation(Number(e.currentKey));
    localStorage.setItem(
      "isUpdateLocation",
      isUpdateLocation === "false" ? "true" : "false"
    );
  };

  if (
    !data ||
    !data.location ||
    data.location.length < 2 ||
    !data.selectedLocation
  )
    return null;

  const selectedLocationId = Number(Array.from(new Set(selectedKey))[0]);

  const selectedLocationName = data?.location.find(
    (item) => selectedLocationId === item.id
  )?.name;

  return (
    <Dropdown className="bg-background">
      <DropdownTrigger>
        {isLoading ? (
          <Spinner size="sm" variant="wave" />
        ) : (
          <Button
            variant="flat"
            className="bg-background p-0"
            startContent={<MapPoint className="text-primary" />}
            endContent={<AltArrowDown className="text-primary" />}
          >
            <span className="truncate">{selectedLocationName}</span>
          </Button>
        )}
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
