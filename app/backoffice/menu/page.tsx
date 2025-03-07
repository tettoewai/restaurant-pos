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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {menus.map((item, index) => (
          <Suspense key={index} fallback={<MenuLoading />}>
            <MenuCard
              id={item.id}
              name={item.name}
              image={item.assetUrl}
              price={item.price}
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
