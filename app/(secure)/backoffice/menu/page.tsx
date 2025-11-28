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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
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
