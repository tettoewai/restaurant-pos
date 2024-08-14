import { fetchDisableLocationMenuCat, fetchMenuCategory } from "@/app/lib/data";
import ItemCard from "@/components/ItemCard";
import NewMenuCategoryDialog from "@/components/NewMenuCategoryDailog";

const MenuCateogory = async () => {
  const [menuCategory, disableLocationMenuCategory] = await Promise.all([
    fetchMenuCategory(),
    fetchDisableLocationMenuCat(),
  ]);
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Menu Category</span>
          <span className="text-sm text-gray-600">
            Manage your menu categories
          </span>
        </div>
        <NewMenuCategoryDialog />
      </div>
      <div className="flex flex-wrap mt-2">
        {menuCategory.map((item) => (
          <ItemCard
            itemType="menuCategory"
            key={item.id}
            id={item.id}
            name={item.name}
            disableLocationMenuCategory={disableLocationMenuCategory}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuCateogory;
