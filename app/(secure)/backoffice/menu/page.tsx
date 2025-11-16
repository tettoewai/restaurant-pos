import {
  fetchDisableLocationMenu,
  fetchMenu,
  fetchMenuCategory,
  fetchMenuCategoryMenu,
} from "@/app/lib/backoffice/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MenuCard from "@/components/MenuCard";
import NewMenuDialog from "@/components/NewMenuDailog";
import { Suspense } from "react";
import { baseMetadata } from "@/app/lib/baseMetadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Menu | ${baseMetadata.title}`,
};

const Menu = async () => {
  const menus = await fetchMenu();
  const menuCategory = await fetchMenuCategory();
  const menuCategoryMenu = await fetchMenuCategoryMenu();
  const disableLocationMenu = await fetchDisableLocationMenu();

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Menu</span>
          <span className="text-sm text-gray-600">Manage your menus</span>
        </div>
        <NewMenuDialog menuCategory={menuCategory} />
      </div>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6 mt-2">
        {menus.map((item, index) => (
          <Suspense key={index} fallback={<MenuLoading />}>
            <MenuCard
              menu={item}
              categories={menuCategory}
              menuCategoryMenu={menuCategoryMenu}
              disableLocationMenu={disableLocationMenu}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default Menu;
