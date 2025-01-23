import {
  fetchAddonCategory,
  fetchAddonWithAddonCat,
  fetchDisableLocationMenuCat,
  fetchLocation,
  fetchMenu,
  fetchMenuAddonCategory,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import {
  Card,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import clsx from "clsx";
import Image from "next/image";
import { BiSolidCategoryAlt } from "react-icons/bi";
import {
  MdAttachMoney,
  MdLocationOn,
  MdRestaurantMenu,
  MdTableBar,
} from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
import MoreOptionButton from "./MoreOptionButton";
import { Table } from "@prisma/client";

interface Props {
  id: number;
  name: string;
  addonCategoryId?: number;
  itemType: "addonCategory" | "addon" | "table" | "location" | "menuCategory";
  required?: boolean;
  assetUrl?: string;
  price?: number;
  isActive?: boolean;
}
export default async function ItemCard({
  id,
  itemType,
  name,
  required,
  addonCategoryId,
  assetUrl,
  price,
  isActive,
}: Props) {
  const iconClasses = "size-8 mb-1 text-primary";
  const menuAddonCategory =
    itemType === "addonCategory" ? await fetchMenuAddonCategory() : undefined;
  const menus = itemType === "addonCategory" ? await fetchMenu() : undefined;
  const addonCategory =
    itemType === "addonCategory" || itemType === "addon"
      ? await fetchAddonCategory()
      : undefined;
  const location = itemType === "location" ? await fetchLocation() : undefined;
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
  return (
    <Card
      className={clsx(
        "bg-background h-48 p-1 flex flex-col items-center relative overflow-hidden justify-center m-1 w-44",
        {
          "opacity-70": isExist && itemType === "menuCategory",
          "border-primary border-1": isActive,
          "w-40 h-40": itemType === "menuCategory" || itemType === "location",
        }
      )}
    >
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <MoreOptionButton
          id={id}
          itemType={itemType}
          addonCategory={addonCategory}
          menu={menus}
          table={table}
          location={location}
          disableLocationMenuCat={disableLocationMenuCategory}
        />
      </div>
      {itemType === "addonCategory" ? (
        <TbCategoryPlus className={iconClasses} />
      ) : itemType === "addon" ? (
        <MdRestaurantMenu className={iconClasses} />
      ) : itemType === "menuCategory" ? (
        <BiSolidCategoryAlt className={iconClasses} />
      ) : itemType === "table" ? (
        <div className="flex justify-center items-center h-3/4 w-full overflow-hidden">
          {assetUrl ? (
            <Image
              src={assetUrl}
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
        <div className="flex justify-center items-center h-3/4 w-full overflow-hidden">
          <MdLocationOn className={iconClasses} />
        </div>
      ) : null}
      <p
        className={clsx("mt-2 text-wrap text-center", {
          "text-red-500": Boolean(!hasAddon && itemType === "addonCategory"),
        })}
      >
        {name}
        {required ? <span className="text-primary"> *</span> : null}
      </p>
      <div className="mt-4 w-full flex justify-center flex-wrap">
        {addonCategory && itemType !== "addonCategory" ? (
          <Chip variant="bordered" className="m-[1px]" size="sm">
            {addonCategory.find((item) => item.id === addonCategoryId)?.name}
          </Chip>
        ) : null}
        {validMenus &&
          validMenus.slice(0, 2).map((item) => (
            <Chip
              variant="bordered"
              className="m-[1px]"
              size="sm"
              key={item.id}
            >
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
    </Card>
  );
}
