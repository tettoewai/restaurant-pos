import { Card, Chip, ScrollShadow, Spacer } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MdAttachMoney } from "react-icons/md";
import {
  fetchCompany,
  fetchMenu,
  fetchMenuCategory,
  fetchMenuCategoryMenu,
  fetchTableWithId,
} from "../lib/data";
import { MenuLoading } from "../ui/skeletons";
import PromotionCard from "./components/PromotionCard";

const Order = async ({
  searchParams,
}: {
  searchParams: { tableId: string; menuCat: string };
}) => {
  const tableId = Number(searchParams.tableId);
  const menuCat = Number(searchParams.menuCat);
  if (!tableId) return null;
  const table = await fetchTableWithId(tableId);
  if (!table) return <div>There is no table. Please rescan qr code.</div>;
  const [company, menuCategory, menuCategoryMenu, menu] = await Promise.all([
    fetchCompany(),
    fetchMenuCategory(),
    fetchMenuCategoryMenu(),
    fetchMenu(),
  ]);
  const getMenuWithMenuCat = (id: number) => {
    const validMenuIds = menuCategoryMenu
      .filter((item) => item.menuCategoryId === id)
      .map((menuCat) => menuCat.menuId);
    const validMenus = menu.filter((item) => validMenuIds.includes(item.id));
    return validMenus;
  };
  const validMenu = !menuCat ? menu : getMenuWithMenuCat(menuCat);
  return (
    <div className="mt-4 h-full">
      <span className="mt-3 text-lg">Welcome From {company?.name}!</span>
      <Spacer y={2} />
      <PromotionCard />
      <Spacer y={3} />
      <div className="flex flex-col items-center w-full">
        <span className="text-primary">Menus</span>
        <Spacer y={2} />
        <ScrollShadow
          hideScrollBar
          orientation="horizontal"
          className="w-full flex space-x-1 p-1 justify-start"
        >
          <Link href={`?tableId=2`}>
            <Chip
              size="lg"
              color={!menuCat ? "primary" : "default"}
              variant="bordered"
            >
              All
            </Chip>
          </Link>
          {menuCategory.map((item) => (
            <Link key={item.id} href={`?tableId=${tableId}&menuCat=${item.id}`}>
              <Chip
                size="lg"
                color={menuCat === item.id ? "primary" : "default"}
                variant="bordered"
              >
                {item.name}
              </Chip>
            </Link>
          ))}
        </ScrollShadow>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {validMenu?.map((item) => (
            <Suspense key={item.id} fallback={<MenuLoading />}>
              <Card className="bg-background max-w-48 h-56 md:w-48 md:h-60 flex flex-col items-center relative overflow-hidden mr-2 mt-2">
                <div className="flex justify-center items-center h-[57%] w-full overflow-hidden">
                  <Image
                    src={item.assetUrl || "/default-menu.png"}
                    alt="menu"
                    width={100}
                    height={100}
                    className="h-full w-full object-cover "
                  />
                </div>
                <p className="mt-5 truncate ...">{item.name}</p>
                <div className="flex items-center mt-1 mb-1">
                  <MdAttachMoney className="text-xl text-primary" />
                  <p>{item.price}</p>
                </div>
              </Card>
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Order;
