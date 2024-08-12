"use client";
import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import { AddonCategory, Location, Menu, MenuCategory } from "@prisma/client";
import { IoMdMore } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import DeleteAddonCategoryDialog from "./DeleteAddonCategoryDailog";
import DeleteAddonDialog from "./DeleteAddonDailog";
import DeleteLocationDialog from "./DeleteLocationDailog";
import DeleteMenuCategoryDialog from "./DeleteMenuCategoryDailog";
import DeleteMenuDialog from "./DeleteMenuDailog";
import DeleteTableDialog from "./DeleteTableDailog";
import { MenuAvailable } from "./MenuAvailable";
import UpdateAddonCategoryDialog from "./UpdateAddonCategoryDailog";
import UpdateAddonDialog from "./UpdateAddonDailog";
import UpdateLocationDialog from "./UpdateLocationDailog";
import UpdateMenuCategoryDialog from "./UpdateMenuCategoryDailog";
import UpdateMenuDialog from "./UpdateMenuDailog";
import UpdateTableDialog from "./UpdateTableDailog";
import { useEffect, useState } from "react";
import {
  fetchDisableLocationMenu,
  fetchDisableLocationMenuCat,
} from "@/app/lib/data";
import {
  handleDisableLocationMenu,
  handleDisableLocationMenuCat,
} from "@/app/lib/action";
import MenuCard from "./MenuCard";

interface Props {
  id: number;
  itemType:
    | "menu"
    | "menuCategory"
    | "addonCategory"
    | "addon"
    | "table"
    | "location";
  categories?: MenuCategory[];
  menu?: Menu[];
  addonCategory?: AddonCategory[];
  location?: Location[];
}

export default function MoreOptionButton({
  id,
  itemType,
  categories,
  menu,
  addonCategory,
  location,
}: Props) {
  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onOpenChange: onUpdateOpenChange,
    onClose: onUpdateClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
    onClose: onDeleteClose,
  } = useDisclosure();
  const iconClasses =
    "text-xl text-default-500 pointer-events-none flex-shrink-0";
  const [available, setAvailable] = useState<boolean>(false);
  const [availableMenuCat, setAvailableMenuCat] = useState<boolean>(false);
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  useEffect(() => {
    const getDisableLocationMenu = async () => {
      try {
        const disableLocationMenu = await fetchDisableLocationMenu();
        const disableLocationMenuCat = await fetchDisableLocationMenuCat();
        const isExist = disableLocationMenu.find((item) => item.menuId === id);
        const isExistCat = disableLocationMenuCat.find(
          (item) => item.menuCategoryId === id
        );
        if (isExist) {
          setAvailable(false);
        } else {
          setAvailable(true);
        }
        if (isExistCat) {
          setAvailableMenuCat(false);
        } else {
          setAvailableMenuCat(true);
        }
      } catch (error) {
        console.error("Failed to fetch disable location menu:", error);
      }
    };
    getDisableLocationMenu();
  }, [isUpdateLocation, id]);
  const handleSwitchChange = (e: boolean) => {
    if (itemType === "menu") {
      handleDisableLocationMenu({ available: e, menuId: id });
      setAvailable(e);
    } else {
      handleDisableLocationMenuCat({ available: e, menuCategoryId: id });
      setAvailableMenuCat(e);
    }
  };
  return (
    <>
      <Dropdown className="bg-background min-w-12">
        <DropdownTrigger>
          <button className="bg-background rounded-md bg-opacity-40 outline-none">
            <IoMdMore className="size-7" />
          </button>
        </DropdownTrigger>
        <DropdownMenu variant="faded">
          <DropdownItem
            key="edit"
            endContent={<MdEdit className={iconClasses} />}
            onClick={onUpdateOpen}
          >
            Edit
          </DropdownItem>
          {itemType === "menu" ? (
            <DropdownItem
              closeOnSelect={false}
              key="available"
              endContent={
                <Switch
                  isSelected={available}
                  onValueChange={handleSwitchChange}
                  className="m-0"
                  size="sm"
                  aria-label="Available"
                />
              }
            >
              Available
            </DropdownItem>
          ) : itemType === "menuCategory" ? (
            <DropdownItem
              closeOnSelect={false}
              key="available"
              endContent={
                <Switch
                  isSelected={availableMenuCat}
                  onValueChange={handleSwitchChange}
                  className="m-0"
                  size="sm"
                  aria-label="Available"
                />
              }
            >
              Available
            </DropdownItem>
          ) : (
            <DropdownItem className="hidden" />
          )}
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            endContent={<MdDelete className={cn(iconClasses, "text-danger")} />}
            onClick={onDeleteOpen}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      {itemType === "menu" ? (
        <>
          <UpdateMenuDialog
            id={id}
            menuCategory={categories}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteMenuDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "menuCategory" ? (
        <>
          <UpdateMenuCategoryDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteMenuCategoryDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "addonCategory" ? (
        <>
          <UpdateAddonCategoryDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
            menu={menu}
          />
          <DeleteAddonCategoryDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "addon" ? (
        <>
          <UpdateAddonDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
            addonCategory={addonCategory}
          />
          <DeleteAddonDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "location" ? (
        <>
          <UpdateLocationDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteLocationDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
            location={location}
          />
        </>
      ) : itemType === "table" ? (
        <>
          <UpdateTableDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteTableDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : null}
    </>
  );
}
