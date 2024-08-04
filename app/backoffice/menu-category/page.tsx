import { fetchMenuCategory } from "@/app/lib/data";
import MoreOptionButton from "@/components/MoreOptionButton";
import { Card } from "@nextui-org/react";
import { BiSolidCategoryAlt } from "react-icons/bi";

const MenuCateogory = async () => {
  const menuCategory = await fetchMenuCategory();
  return (
    <div>
      {menuCategory.map((item) => (
        <Card
          key={item.id}
          className="w-40 h-32 flex justify-center items-center"
        >
          <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
            <MoreOptionButton id={item.id} itemType="menuCategory" />
          </div>
          <BiSolidCategoryAlt className="size-8 mb-3" />
          <span className="text-center">{item.name}</span>
        </Card>
      ))}
    </div>
  );
};

export default MenuCateogory;
