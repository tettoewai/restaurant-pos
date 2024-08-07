import {
  fetchMenu,
  fetchMenuAddonCategory,
  fetchMenuCategory,
  fetchMenuCategoryMenu,
} from "@/app/lib/data";
import { Card, Chip } from "@nextui-org/react";
import Image from "next/image";
import { MdAttachMoney } from "react-icons/md";
import MoreOptionButton from "./MoreOptionButton";

interface Props {
  id: number;
  name: string;
  image?: string | null;
  price?: number;
}
export default async function MenuCard({ id, name, image, price }: Props) {
  const categories = await fetchMenuCategory();
  const menuCategoryMenu = await fetchMenuCategoryMenu();
  if (!categories) return;
  const validMenuCategoryIds = menuCategoryMenu
    .filter((item) => item.menuId === id)
    .map((categoryMenu) => categoryMenu.menuCategoryId);
  const menuCategory = categories.filter((item) =>
    validMenuCategoryIds.includes(item.id)
  );
  return (
    <Card className="bg-background w-[170px] h-56 mr-2 mb-2 md:w-48 md:h-60 flex flex-col items-center relative overflow-hidden">
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
          <Chip variant="bordered" size="sm">
            ....
          </Chip>
        )}
      </div>
    </Card>
  );
}
