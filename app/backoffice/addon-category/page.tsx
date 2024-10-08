import {
  fetchAddonCategory,
  fetchMenu,
  fetchMenuAddonCategory,
} from "@/app/lib/backoffice/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import NewAddonCategoryDialog from "@/components/NewAddonCategoryDailog";
import { Suspense } from "react";

const AddonCateogory = async () => {
  const [addonCategory, menus, menuAddonCategory] = await Promise.all([
    fetchAddonCategory(),
    fetchMenu(),
    fetchMenuAddonCategory(),
  ]);
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon Category</span>
          <span className="text-sm text-gray-600">
            Manage your addon category
          </span>
        </div>
        <NewAddonCategoryDialog menus={menus} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {addonCategory.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              id={item.id}
              name={item.name}
              itemType="addonCategory"
              required={item.isRequired}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default AddonCateogory;
