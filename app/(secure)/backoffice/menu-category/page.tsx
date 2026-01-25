import {
  fetchMenuCategory,
  fetchDisableLocationMenuCat,
} from "@/app/lib/backoffice/data";
import { baseMetadata } from "@/app/lib/baseMetadata";
import MenuCategoryList from "@/components/MenuCategoryList";
import NewMenuCategoryDialog from "@/components/NewMenuCategoryDailog";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Menu Category | ${baseMetadata.title}`,
};

const MenuCateogory = async () => {
  const [menuCategory, disableLocationMenuCategory] = await Promise.all([
    fetchMenuCategory(),
    fetchDisableLocationMenuCat(),
  ]);
  if (!menuCategory || !menuCategory.length)
    return (
      <div>
        <span>There is no menu-category.</span>
      </div>
    );
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
      <MenuCategoryList
        menuCategories={menuCategory}
        disableLocationMenuCategory={disableLocationMenuCategory}
      />
    </div>
  );
};

export default MenuCateogory;
