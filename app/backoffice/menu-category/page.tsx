import {
  fetchDisableLocationMenuCat,
  fetchMenuCategory,
} from "@/app/lib/backoffice/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import NewMenuCategoryDialog from "@/components/NewMenuCategoryDailog";
import { Suspense } from "react";
import { baseMetadata } from "@/app/lib/baseMetadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Menu Category | ${baseMetadata.title}`,
};

const MenuCateogory = async () => {
  const menuCategory = await fetchMenuCategory();
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {menuCategory.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard itemType="menuCategory" id={item.id} name={item.name} />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default MenuCateogory;
