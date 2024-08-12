"use client";
import { handleDisableLocationMenu } from "@/app/lib/action";
import { fetchDisableLocationMenu } from "@/app/lib/data";
import { DropdownItem, Switch } from "@nextui-org/react";
import { useEffect, useState } from "react";

export const MenuAvailable = ({ id }: { id: number }) => {
  const [available, setAvailable] = useState<boolean>(false);
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  useEffect(() => {
    const getDisableLocationMenu = async () => {
      const disableLocationMenu = await fetchDisableLocationMenu();
      const isExist = disableLocationMenu.find((item) => item.menuId === id);
      if (isExist) {
        setAvailable(false);
      } else {
        setAvailable(true);
      }
    };
    getDisableLocationMenu();
  }, [isUpdateLocation, id]);
  const handleSwitchChange = (e: boolean) => {
    handleDisableLocationMenu({ available: e, menuId: id });
    setAvailable(e);
  };
  return (
    <DropdownItem
      closeOnSelect={false}
      key="available"
      endContent={
        <Switch
          isSelected={available}
          onValueChange={handleSwitchChange}
          className="p-0"
          size="sm"
          aria-label="Available"
        />
      }
    >
      Available
    </DropdownItem>
  );
};
