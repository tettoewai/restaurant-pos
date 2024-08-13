import {
  fetchDisableLocationMenu,
  fetchMenu,
  fetchMenuCategory,
  fetchMenuCategoryMenu,
} from "@/app/lib/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MenuCard from "@/components/MenuCard";
import NewMenuDialog from "@/components/NewMenuDailog";
import { Suspense } from "react";

const Menu = async () => {
  const menus = await fetchMenu();
  const menuCategory = await fetchMenuCategory();

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Menu</span>
          <span className="text-sm text-gray-600">Manage your menus</span>
        </div>
        <NewMenuDialog menuCategory={menuCategory} />
      </div>
      <div className="flex flex-wrap mt-2">
        {menus.map((item, index) => (
          <Suspense key={index} fallback={<MenuLoading />}>
            <MenuCard
              id={item.id}
              name={item.name}
              image={item.assetUrl}
              price={item.price}
              categories={menuCategory}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default Menu;
