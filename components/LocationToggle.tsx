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
} from "@nextui-org/react";
import { Location } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { MdLocationOn } from "react-icons/md";

export default function Locationtoggle() {
  const [selectedKey, setSelectedKey] = React.useState<Set<string>>(
    new Set([])
  );
  const [location, setLocation] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  useEffect(() => {
    const getLocation = async () => {
      setIsLoading(true);
      const [locations, selectedLocation] = await Promise.all([
        fetchLocation(),
        fetchSelectedLocation(),
      ]);
      setLocation(locations);
      setSelectedKey(new Set(String(selectedLocation?.id)));
      setIsLoading(false);
    };

    getLocation();
  }, [isUpdateLocation]);

  const handleSelectChange = async (e: any) => {
    setSelectedKey(e);
    await updateSelectLocation(Number(e.currentKey));
    localStorage.setItem(
      "isUpdateLocation",
      isUpdateLocation === "false" ? "true" : "false"
    );
  };

  const selectedLocationName = location.find(
    (item) => item.id === Number(Array.from(selectedKey)[0])
  )?.name;

  return (
    <Dropdown>
      <DropdownTrigger>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Button
            variant="flat"
            className="bg-background"
            startContent={<MdLocationOn className="text-primary" />}
            endContent={<IoIosArrowDown className="text-primary" />}
          >
            {selectedLocationName}
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
        {location.map((item) => (
          <DropdownItem key={item.id.toString()}>{item.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
