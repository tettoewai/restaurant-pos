"use server";
import {
  fetchTableWithId,
  fetchCompany,
  fetchMenuCategoryMenu,
  fetchLocationWithId,
} from "@/app/lib/backoffice/data";
import { fetchMenuCategoryOrder, fetchMenuOrder } from "@/app/lib/order/data";
import { MenuLoading } from "@/app/ui/skeletons";
import { Card, Chip, Divider, ScrollShadow, Spacer } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MdAttachMoney } from "react-icons/md";
import PromotionCard from "./PromotionCard";

const Order = async ({
  tableId,
  menuCat,
}: {
  tableId: number;
  menuCat: number;
}) => {
  if (!tableId) return null;
  const table = await fetchTableWithId(tableId);
  if (!table) return <div>There is no table. Please rescan qr code.</div>;
  const [company, menuCategory, menuCategoryMenu, menuOrder, location] =
    await Promise.all([
      fetchCompany(),
      fetchMenuCategoryOrder(tableId),
      fetchMenuCategoryMenu(),
      fetchMenuOrder(tableId),
      fetchLocationWithId(table.locationId),
    ]);
  const getMenuWithMenuCat = (id: number) => {
    const validMenuIds = menuCategoryMenu
      .filter((item) => item.menuCategoryId === id)
      .map((menuCat) => menuCat.menuId);
    const validMenus = menuOrder.filter((item) =>
      validMenuIds.includes(item.id)
    );
    return validMenus;
  };
  const validMenu = !menuCat ? menuOrder : getMenuWithMenuCat(menuCat);
  return (
    <div className="mt-4 h-full">
      <span className="mt-3 text-lg">Welcome From {company?.name}!</span>
      <Spacer y={2} />
      <PromotionCard />
      <Spacer y={3} />
      <div className="flex flex-col items-center w-full">
        <span className="text-primary text-center">
          Menus
          <Divider className="bg-gray-400 w-32 mt-1" />
        </span>

        <Spacer y={2} />
        <ScrollShadow
          orientation="horizontal"
          className="w-full flex space-x-1 pb-3 justify-start"
        >
          <Link href={`?tableId=${tableId}`}>
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
          {validMenu.length > 0 ? (
            validMenu?.map((item, index) => (
              <Suspense key={item.id} fallback={<MenuLoading />}>
                <Link href={`/order/${item.id}?tableId=${tableId}`}>
                  <Card className="bg-background w-[170px] h-56 md:w-48 md:h-60 flex flex-col items-center relative overflow-hidden mr-2 mt-2">
                    <div className="flex justify-center items-center h-[57%] w-full overflow-hidden">
                      <Image
                        src={item.assetUrl || "/default-menu.png"}
                        alt="menu"
                        width={100}
                        height={100}
                        className="h-full w-full object-cover "
                        priority={index < 3} // Load priority for first 3 images
                      />
                    </div>
                    <p className="mt-5 truncate ...">{item.name}</p>
                    <div className="flex items-center mt-1 mb-1">
                      <MdAttachMoney className="text-xl text-primary" />
                      <p>{item.price}</p>
                    </div>
                  </Card>
                </Link>
              </Suspense>
            ))
          ) : (
            <h2>There is no menu!</h2>
          )}
        </div>
      </div>
    </div>
  );
};
export default Order;