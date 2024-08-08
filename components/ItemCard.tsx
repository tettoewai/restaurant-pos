import {
  Card,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { AddonCategory, Menu, MenuAddonCategory } from "@prisma/client";
import { TbCategoryPlus } from "react-icons/tb";
import MoreOptionButton from "./MoreOptionButton";
import { MdRestaurantMenu } from "react-icons/md";

interface Props {
  id: number;
  name: string;
  menus?: Menu[];
  addonCategory?: AddonCategory[];
  addonCategoryId?: number;
  menuAddonCategory?: MenuAddonCategory[];
  itemType: "addonCategory" | "addon";
  required?: boolean;
}
export default function ItemCard({
  id,
  itemType,
  name,
  menuAddonCategory,
  menus,
  required,
  addonCategoryId,
  addonCategory,
}: Props) {
  const validMenus =
    menuAddonCategory &&
    menus?.filter((menu) =>
      menuAddonCategory
        .filter((item) => item.addonCategoryId === id)
        .map((menuAddonCat) => menuAddonCat.menuId)
        .includes(menu.id)
    );
  return (
    <Card className="bg-background w-[170px] h-44 p-1 mr-2 mb-2 md:w-48 flex flex-col items-center relative overflow-hidden">
      <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
        <MoreOptionButton
          id={id}
          itemType={itemType}
          addonCategory={addonCategory}
          menu={menus}
        />
      </div>
      {itemType === "addonCategory" ? (
        <TbCategoryPlus className="size-8 mt-8 mb-1 text-primary" />
      ) : itemType === "addon" ? (
        <MdRestaurantMenu className="size-8 mt-8 mb-1 text-primary" />
      ) : null}
      <p className="mt-2 truncate ...">
        {name}
        {required ? <span className="text-primary"> *</span> : null}
      </p>
      <div className="mt-4 w-full flex justify-center flex-wrap">
        {addonCategory && (
          <Chip variant="bordered" className="m-[1px]" size="sm">
            {addonCategory.find((item) => item.id === addonCategoryId)?.name}
          </Chip>
        )}
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
    </Card>
  );
}
