"use client";
import {
  handleDisableLocationMenu,
  handleDisableLocationMenuCat,
} from "@/app/lib/action";
import {
  fetchDisableLocationMenu,
  fetchDisableLocationMenuCat,
} from "@/app/lib/data";
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
import { useEffect, useState } from "react";
import { IoMdMore } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import DeleteAddonCategoryDialog from "./DeleteAddonCategoryDailog";
import DeleteAddonDialog from "./DeleteAddonDailog";
import DeleteLocationDialog from "./DeleteLocationDailog";
import DeleteMenuCategoryDialog from "./DeleteMenuCategoryDailog";
import DeleteMenuDialog from "./DeleteMenuDailog";
import DeleteTableDialog from "./DeleteTableDailog";
import UpdateAddonCategoryDialog from "./UpdateAddonCategoryDailog";
import UpdateAddonDialog from "./UpdateAddonDailog";
import UpdateLocationDialog from "./UpdateLocationDailog";
import UpdateMenuCategoryDialog from "./UpdateMenuCategoryDailog";
import UpdateMenuDialog from "./UpdateMenuDailog";
import UpdateTableDialog from "./UpdateTableDailog";
import { toast } from "react-toastify";

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

  const [availability, setAvailability] = useState({
    menu: false,
    menuCategory: false,
    // add other item types if needed
  });

  useEffect(() => {
    const fetchDisableData = async () => {
      try {
        let data;
        if (itemType === "menu") {
          data = await fetchDisableLocationMenu();
          const isItemDisabled = data.some((item) => item.menuId === id);
          setAvailability((prev) => ({ ...prev, menu: !isItemDisabled }));
        } else if (itemType === "menuCategory") {
          data = await fetchDisableLocationMenuCat();
          const isItemDisabled = data.some(
            (item) => item.menuCategoryId === id
          );
          setAvailability((prev) => ({
            ...prev,
            menuCategory: !isItemDisabled,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch data. Please try again.");
      }
    };
    fetchDisableData();
  }, [itemType, id]);

  const handleSwitchChange = async (e: boolean) => {
    try {
      let result;
      if (itemType === "menu") {
        result = await handleDisableLocationMenu({ available: e, menuId: id });
        if (result.isSuccess) setAvailability((prev) => ({ ...prev, menu: e }));
      } else if (itemType === "menuCategory") {
        result = await handleDisableLocationMenuCat({
          available: e,
          menuCategoryId: id,
        });
        if (result.isSuccess)
          setAvailability((prev) => ({ ...prev, menuCategory: e }));
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability. Please try again.");
    }
  };

  const getDialogComponents = () => {
    switch (itemType) {
      case "menu":
        return {
          updateDialog: (
            <UpdateMenuDialog
              id={id}
              menuCategory={categories}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          ),
          deleteDialog: (
            <DeleteMenuDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
            />
          ),
        };
      case "menuCategory":
        return {
          updateDialog: (
            <UpdateMenuCategoryDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          ),
          deleteDialog: (
            <DeleteMenuCategoryDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
            />
          ),
        };
      case "addonCategory":
        return {
          updateDialog: (
            <UpdateAddonCategoryDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
              menu={menu}
            />
          ),
          deleteDialog: (
            <DeleteAddonCategoryDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
            />
          ),
        };
      case "addon":
        return {
          updateDialog: (
            <UpdateAddonDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
              addonCategory={addonCategory}
            />
          ),
          deleteDialog: (
            <DeleteAddonDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
            />
          ),
        };
      case "location":
        return {
          updateDialog: (
            <UpdateLocationDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          ),
          deleteDialog: (
            <DeleteLocationDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
              location={location}
            />
          ),
        };
      case "table":
        return {
          updateDialog: (
            <UpdateTableDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          ),
          deleteDialog: (
            <DeleteTableDialog
              id={id}
              onClose={onDeleteClose}
              onOpenChange={onDeleteOpenChange}
              isOpen={isDeleteOpen}
            />
          ),
        };
      default:
        return { updateDialog: null, deleteDialog: null };
    }
  };

  const { updateDialog, deleteDialog } = getDialogComponents();

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
                  isSelected={availability.menu}
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
                  isSelected={availability.menuCategory}
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
      {updateDialog}
      {deleteDialog}
    </>
  );
}
