"use client";
import {
  handleDisableLocationMenu,
  handleDisableLocationMenuCat,
} from "@/app/lib/backoffice/action";
import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import {
  AddonCategory,
  DisabledLocationMenu,
  DisabledLocationMenuCategory,
  Location,
  Menu,
  MenuCategory,
  Table,
} from "@prisma/client";
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
import { BsQrCodeScan } from "react-icons/bs";
import QrcodePrint from "./QrcodePrint";
import { TbLocationCancel } from "react-icons/tb";
import { OrderData } from "@/general";
import CancelOrderDialog from "./CancelOrderDialog";

interface Props {
  id: number;
  itemType:
    | "menu"
    | "menuCategory"
    | "addonCategory"
    | "addon"
    | "table"
    | "location"
    | "activeOrder"
    | "order";
  categories?: MenuCategory[];
  menu?: Menu[];
  addonCategory?: AddonCategory[];
  location?: Location[];
  table?: Table;
  disableLocationMenuCat?: DisabledLocationMenuCategory[];
  disableLocationMenu?: DisabledLocationMenu[];
  orderData?: OrderData;
  tableId?: number;
}

export default function MoreOptionButton({
  id,
  itemType,
  categories,
  menu,
  addonCategory,
  location,
  table,
  disableLocationMenuCat,
  disableLocationMenu,
  orderData,
  tableId,
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
      if (itemType === "menu") {
        const isExist =
          disableLocationMenu &&
          disableLocationMenu.find((item) => item.menuId === id);
        if (isExist) {
          setAvailable(false);
        } else {
          setAvailable(true);
        }
      } else if (itemType === "menuCategory") {
        const isExistCat =
          disableLocationMenuCat &&
          disableLocationMenuCat.find((item) => item.menuCategoryId === id);
        if (isExistCat) {
          setAvailableMenuCat(false);
        } else {
          setAvailableMenuCat(true);
        }
      }
    };
    getDisableLocationMenu();
  }, [
    isUpdateLocation,
    disableLocationMenu,
    disableLocationMenuCat,
    id,
    itemType,
  ]);
  const handleSwitchChange = async (e: boolean) => {
    if (itemType === "menu") {
      const { isSuccess } = await handleDisableLocationMenu({
        available: e,
        menuId: id,
      });
      if (isSuccess) {
        setAvailable(e);
      }
    } else if (itemType === "menuCategory") {
      const { isSuccess } = await handleDisableLocationMenuCat({
        available: e,
        menuCategoryId: id,
      });
      if (isSuccess) {
        setAvailableMenuCat(e);
      }
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
            href={
              itemType === "activeOrder"
                ? `/order/${orderData?.menuId}?tableId=${tableId}&orderId=${orderData?.itemId}`
                : ""
            }
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
          ) : itemType === "table" ? (
            <DropdownItem
              closeOnSelect={false}
              key="printQrcode"
              textValue="printQrdcode"
              endContent={<BsQrCodeScan className={iconClasses} />}
            >
              <QrcodePrint table={table} />
            </DropdownItem>
          ) : (
            <DropdownItem className="hidden">None</DropdownItem>
          )}
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            endContent={
              itemType === "activeOrder" ? (
                <TbLocationCancel className={cn(iconClasses, "text-danger")} />
              ) : (
                <MdDelete className={cn(iconClasses, "text-danger")} />
              )
            }
            onClick={onDeleteOpen}
          >
            {itemType === "activeOrder" ? "Cancel" : "Delete"}
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
      ) : itemType === "activeOrder" ? (
        <CancelOrderDialog
          id={orderData?.itemId}
          onClose={onDeleteClose}
          onOpenChange={onDeleteOpenChange}
          isOpen={isDeleteOpen}
        />
      ) : null}
    </>
  );
}
