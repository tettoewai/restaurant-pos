"use client";

import { formatCurrency } from "@/function";
import {
  Card,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import {
  DisabledLocationMenu,
  Menu,
  MenuCategory,
  MenuCategoryMenu,
} from "@prisma/client";
import { Banknote2 } from "@solar-icons/react/ssr";
import Image from "next/image";
import MoreOptionButton from "./MoreOptionButton";

interface Props {
  menu: Menu;
  categories: MenuCategory[];
  menuCategoryMenu: MenuCategoryMenu[];
  disableLocationMenu: DisabledLocationMenu[];
  onEditMenu?: (id: number, menu: Menu, menuCategoryMenu: MenuCategoryMenu[]) => void;
}
export default function MenuCard({
  menu,
  categories,
  menuCategoryMenu,
  disableLocationMenu,
  onEditMenu,
}: Props) {
  const validMenuCategoryIds = menuCategoryMenu
    .filter((item) => item.menuId === menu.id)
    .map((categoryMenu) => categoryMenu.menuCategoryId);
  const menuCategory = categories.filter((item) =>
    validMenuCategoryIds.includes(item.id)
  );
  const currentMenuCategoryMenu = menuCategoryMenu.filter(
    (item) => item.menuId === menu.id
  );
  const isExist = disableLocationMenu.find((item) => item.menuId === menu.id);
  return (
    <Card
      className={`p-4 bg-background mr-2 mb-2 flex flex-col items-center relative overflow-hidden ${isExist ? "opacity-50" : ""
        }`}
    >
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <MoreOptionButton
          id={menu.id}
          itemType="menu"
          categories={categories}
          disableLocationMenu={disableLocationMenu}
          menu={menu}
          menuCategoryMenu={currentMenuCategoryMenu}
          onEditMenu={onEditMenu}
        />
      </div>
      <div className="flex justify-center items-center h-40 w-full overflow-hidden">
        <Image
          src={menu.assetUrl || "/default-menu.png"}
          alt="menu"
          width={1080}
          height={1080}
          className="w-full h-40 object-cover rounded-md"
        />
      </div>
      <span className="mt-2 text-wrap text-center">{menu.name}</span>
      {menu.price && (
        <div className="flex items-center mt-1 mb-1">
          <Banknote2 className="text-xl text-primary" />
          <p>{formatCurrency(menu.price)}</p>
        </div>
      )}
      <div className="space-x-1">
        {menuCategory.slice(0, 2).map((item, index) => (
          <Chip variant="bordered" size="sm" key={item.id}>
            {item.name}
          </Chip>
        ))}
        {menuCategory.length > 2 && (
          <Popover placement="bottom-start" showArrow={true}>
            <PopoverTrigger>
              <Chip variant="bordered" size="sm" className="cursor-pointer">
                ....
              </Chip>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <div className="space-y-1 flex flex-col">
                {menuCategory.slice(2).map((item) => (
                  <Chip variant="bordered" size="sm" key={item.id}>
                    {item.name}
                  </Chip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </Card>
  );
}
