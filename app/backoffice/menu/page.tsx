import { fetchMenuCategory, fetchMenus } from "@/app/lib/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MenuCard from "@/components/MenuCard";
import NewMenuDialog from "@/components/NewMenuDailog";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

const Menu = async () => {
  const session = await getServerSession();
  const userEmail = session?.user?.email;
  if (!userEmail) return;
  const menus = await fetchMenus();
  const menuCategory = await fetchMenuCategory();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div>
          <span>Menu</span>
          <span>Manage your menus</span>
        </div>
        <NewMenuDialog menuCategory={menuCategory} />
      </div>
      <div className="flex flex-wrap">
        {menus.map((item, index) => (
          <Suspense key={index} fallback={<MenuLoading />}>
            <MenuCard
              id={item.id}
              name={item.name}
              image={item.assetUrl}
              price={item.price}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default Menu;
