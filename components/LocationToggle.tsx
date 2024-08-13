"use client";
import { updateSelectLocation } from "@/app/lib/action";
import { fetchLocation, fetchSelectedLocation } from "@/app/lib/data";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
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
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  useEffect(() => {
    const getLocation = async () => {
      const locations = await fetchLocation();
      const selectedLocation = await fetchSelectedLocation();
      setLocation(locations);
      setSelectedKey(new Set(String(selectedLocation?.id)));
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

  const selectedLocation = location.find(
    (item) => item.id === Number(Array.from(selectedKey)[0])
  );

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="flat"
          className="bg-background"
          startContent={<MdLocationOn className="text-primary" />}
          endContent={<IoIosArrowDown className="text-primary" />}
        >
          {selectedLocation?.name}
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
        {location.map((item) => (
          <DropdownItem key={item.id.toString()}>{item.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
