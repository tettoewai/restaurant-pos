import {
  fetchDisableLocationMenu,
  fetchMenu,
  fetchMenuCategory,
  fetchMenuCategoryMenu,
} from "@/app/lib/backoffice/data";
import MenuList from "@/components/MenuList";
import NewMenuDialog from "@/components/NewMenuDailog";
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
      <MenuList
        menus={menus}
        categories={menuCategory}
        menuCategoryMenu={menuCategoryMenu}
        disableLocationMenu={disableLocationMenu}
      />
    </div>
  );
};

export default Menu;
