import { formatCurrency } from "@/function";
import { Card, Chip, Divider, ScrollShadow, Spacer } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MdAttachMoney } from "react-icons/md";
import {
  fetchCompany,
  fetchMenuCategoryMenu,
  fetchTableWithId,
} from "../lib/backoffice/data";
import {
  fetchMenuCategoryOrder,
  fetchMenuOrder,
  fetchPromotionWithTableId,
} from "../lib/order/data";
import { MenuLoading } from "../ui/skeletons";
import CallServiceBtn from "./components/CallServiceBtn";
import PromotionCard from "./components/PromotionCard";
import { Metadata } from "next";
import { baseMetadata } from "../lib/baseMetadata";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `${baseMetadata.title} | Order`,
};

export const revalidate = 60;

const OrderPage = async ({
  searchParams,
}: {
  searchParams: { tableId: string; menuCat: string };
}) => {
  const tableId = Number(searchParams.tableId);
  const menuCat = Number(searchParams.menuCat);
  if (!tableId) return null;
  const table = await fetchTableWithId(tableId);
  const isValid = table && !table.isArchived;
  if (!isValid) return null;
  const [{ company }, menuCategory, menuCategoryMenu, menuOrder, promotions] =
    await Promise.all([
      fetchCompany(),
      fetchMenuCategoryOrder(tableId),
      fetchMenuCategoryMenu(),
      fetchMenuOrder(tableId),
      fetchPromotionWithTableId(tableId),
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
    <div className="mt-4 h-full pb-5">
      <span className="mt-3 text-lg">Welcome From {company?.name}!</span>
      <Spacer y={2} />
      {promotions.length ? (
        <PromotionCard tableId={tableId} promotions={promotions} />
      ) : null}

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
          <Link href={`?tableId=${tableId}`} scroll={false}>
            <Chip
              size="lg"
              color={!menuCat ? "primary" : "default"}
              variant="bordered"
              className="bg-background"
            >
              All
            </Chip>
          </Link>
          {menuCategory.map((item) => (
            <Link
              key={item.id}
              href={`?tableId=${tableId}&menuCat=${item.id}`}
              scroll={false}
            >
              <Chip
                size="lg"
                color={menuCat === item.id ? "primary" : "default"}
                variant="bordered"
                className="bg-background"
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
                    <span className="mt-2 text-wrap text-center">
                      {item.name}
                    </span>
                    <div className="flex items-center mt-1 mb-1">
                      <MdAttachMoney className="text-xl text-primary" />
                      <p>{formatCurrency(item.price)}</p>
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
      <div className="fixed bottom-4 right-4">
        <CallServiceBtn table={table} />
      </div>
    </div>
  );
};
export default OrderPage;
