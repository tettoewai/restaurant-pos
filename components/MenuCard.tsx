"use client";
import {
  Card,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import {
  DisabledLocationMenu,
  MenuCategory,
  MenuCategoryMenu,
} from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { MdAttachMoney } from "react-icons/md";
import MoreOptionButton from "./MoreOptionButton";

interface Props {
  id: number;
  name: string;
  image?: string | null;
  price?: number;
  categories: MenuCategory[];
  menuCategoryMenu: MenuCategoryMenu[];
  disableLocationMenu: DisabledLocationMenu[];
}
export default function MenuCard({
  id,
  name,
  image,
  price,
  categories,
  menuCategoryMenu,
  disableLocationMenu,
}: Props) {
  if (!categories) return;
  const validMenuCategoryIds = menuCategoryMenu
    .filter((item) => item.menuId === id)
    .map((categoryMenu) => categoryMenu.menuCategoryId);
  const menuCategory = categories.filter((item) =>
    validMenuCategoryIds.includes(item.id)
  );
  const isExist = disableLocationMenu.find((item) => item.menuId === id);
  return (
    <Card
      className={clsx(
        "bg-background w-[170px] h-56 mr-2 mb-2 md:w-48 md:h-60 flex flex-col items-center relative overflow-hidden",
        { "opacity-50": isExist }
      )}
    >
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <MoreOptionButton id={id} itemType="menu" categories={categories} />
      </div>
      <div className="flex justify-center items-center h-[57%] w-full overflow-hidden">
        <Image
          src={image || "/default-menu.png"}
          alt="menu"
          width={100}
          height={100}
          className="h-full w-full object-cover "
        />
      </div>
      <p className="mt-2 truncate ...">{name}</p>
      {price && (
        <div className="flex items-center mt-1 mb-1">
          <MdAttachMoney className="text-xl text-primary" />
          <p>{price}</p>
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
