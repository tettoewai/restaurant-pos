import {
  fetchAddonCategory,
  fetchMenu,
  fetchMenuAddonCategory,
} from "@/app/lib/backoffice/data";
import { baseMetadata } from "@/app/lib/baseMetadata";
import AddonCategoryList from "@/components/AddonCategoryList";
import NewAddonCategoryDialog from "@/components/NewAddonCategoryDailog";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Addon Category | ${baseMetadata.title}`,
};

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
      <AddonCategoryList
        addonCategories={addonCategory}
        menus={menus}
        menuAddonCategory={menuAddonCategory}
      />
    </div>
  );
};

export default AddonCateogory;
