import { generateQRCode } from "@/app/lib/backoffice/action";
import {
  fetchAddonCategory,
  fetchAddonWithAddonCat,
  fetchDisableLocationMenuCat,
  fetchMenu,
  fetchMenuAddonCategory,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import { config } from "@/config";
import {
  Card,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { Supplier, Table, Warehouse, WarehouseItem } from "@prisma/client";
import Image from "next/image";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { BsPerson } from "react-icons/bs";
import { LiaWarehouseSolid } from "react-icons/lia";
import {
  MdAttachMoney,
  MdFoodBank,
  MdLocationOn,
  MdRestaurantMenu,
  MdTableBar,
} from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
import MoreOptionButton from "./MoreOptionButton";

interface Props {
  id: number;
  name: string;
  addonCategoryId?: number;
  itemType:
    | "addonCategory"
    | "addon"
    | "table"
    | "location"
    | "menuCategory"
    | "warehouse"
    | "warehouseItem"
    | "supplier"
    | "warehouseStock";
  required?: boolean;
  price?: number;
  isActive?: boolean;
  warehouse?: Warehouse;
  isNotDeletable?: Boolean;
  warehouseItem?: WarehouseItem;
  supplier?: Supplier;
  quantity?: string;
}
export default async function ItemCard({
  id,
  itemType,
  name,
  required,
  addonCategoryId,
  price,
  isActive,
  warehouse,
  isNotDeletable,
  warehouseItem,
  supplier,
  quantity,
}: Props) {
  const iconClasses = "size-9 mb-1 text-primary";
  const menuAddonCategory =
    itemType === "addonCategory" ? await fetchMenuAddonCategory() : undefined;
  const menus = itemType === "addonCategory" ? await fetchMenu() : undefined;
  const addonCategory =
    itemType === "addonCategory" || itemType === "addon"
      ? await fetchAddonCategory()
      : undefined;
  const table =
    itemType === "table" ? ((await fetchTableWithId(id)) as Table) : undefined;
  const disableLocationMenuCategory =
    itemType === "menuCategory"
      ? await fetchDisableLocationMenuCat()
      : undefined;
  const validMenus =
    menuAddonCategory &&
    menus?.filter((menu) =>
      menuAddonCategory
        .filter((item) => item.addonCategoryId === id)
        .map((menuAddonCat) => menuAddonCat.menuId)
        .includes(menu.id)
    );
  const disableLocationMenuCat = await fetchDisableLocationMenuCat();
  const isExist = disableLocationMenuCat.find(
    (item) => item.menuCategoryId === id
  );
  const addons = await fetchAddonWithAddonCat(id);
  const hasAddon = addons && addons?.length > 0;

  const qrCodeData =
    id && itemType === "table"
      ? await generateQRCode(`${config.orderAppUrl}?tableId=${id}`)
      : "";

  return (
    <Card
      shadow="none"
      radius="sm"
      className={`bg-background px-6 py-2 flex flex-col items-center relative overflow-hidden justify-center m-1 min-w-32 ${
        isExist && itemType === "menuCategory" ? "opacity-70" : ""
      } ${isActive ? "border-primary border-1" : ""}`}
    >
      {itemType !== "warehouseStock" ? (
        <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
          <MoreOptionButton
            id={id}
            itemType={itemType}
            addonCategory={addonCategory}
            menus={menus}
            table={table}
            disableLocationMenuCat={disableLocationMenuCategory}
            qrCodeData={qrCodeData || ""}
            warehouse={warehouse}
            isNotDeletable={isNotDeletable}
            warehouseItem={warehouseItem}
            supplier={supplier}
          />
        </div>
      ) : null}

      {itemType === "addonCategory" ? (
        <TbCategoryPlus className={iconClasses} />
      ) : itemType === "addon" ? (
        <MdRestaurantMenu className={iconClasses} />
      ) : itemType === "menuCategory" ? (
        <BiSolidCategoryAlt className={iconClasses} />
      ) : itemType === "table" ? (
        <div className="flex justify-center items-center h-3/4 w-full overflow-hidden">
          {qrCodeData ? (
            <Image
              src={qrCodeData}
              alt="menu"
              width={100}
              height={100}
              className="h-full w-full object-contain rounded-md"
            />
          ) : (
            <MdTableBar className={iconClasses} />
          )}
        </div>
      ) : itemType === "location" ? (
        <MdLocationOn className={iconClasses} />
      ) : itemType === "warehouse" ? (
        <LiaWarehouseSolid className={iconClasses} />
      ) : itemType === "warehouseItem" ? (
        <MdFoodBank className={iconClasses} />
      ) : itemType === "supplier" ? (
        <BsPerson className={iconClasses} />
      ) : null}
      <p
        className={`mt-2 text-wrap text-center font-semibold ${
          Boolean(!hasAddon && itemType === "addonCategory")
            ? "text-red-500"
            : ""
        }`}
      >
        {name}
        {required ? <span className="text-primary"> *</span> : null}
      </p>
      {itemType === "warehouseStock" ? <p></p> : null}
      <div className="mt-4 w-full flex justify-center flex-wrap">
        {addonCategory && itemType !== "addonCategory" ? (
          <Chip variant="bordered" className="m-px" size="sm">
            {addonCategory.find((item) => item.id === addonCategoryId)?.name}
          </Chip>
        ) : null}
        {validMenus &&
          validMenus.slice(0, 2).map((item) => (
            <Chip variant="bordered" className="m-px" size="sm" key={item.id}>
              {item.name}
            </Chip>
          ))}
        {validMenus && validMenus.length > 2 && (
          <Popover placement="bottom-start" showArrow={true}>
            <PopoverTrigger>
              <Chip variant="bordered" size="sm" className="cursor-pointer">
                ....
              </Chip>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <div className="space-y-1 flex flex-col">
                {validMenus.slice(2).map((item) => (
                  <Chip variant="bordered" size="sm" key={item.id}>
                    {item.name}
                  </Chip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {price !== undefined && (
        <div className="flex items-center mt-1 mb-1">
          <MdAttachMoney className="text-xl text-primary" />
          <p>{price}</p>
        </div>
      )}
      {itemType === "warehouseStock" ? <p>{quantity}</p> : null}
    </Card>
  );
}
