import {
  fetchAddon,
  fetchAddonCategory,
  fetchMenuAddonCategory,
  fetchMenuWithId,
  getAddonPricesForMenus,
} from "@/app/lib/backoffice/data";
import { fetchOrderWithItemId } from "@/app/lib/order/data";
import { Card } from "@heroui/react";
import Image from "next/image";
import { Suspense } from "react";
import MenuForm from "../components/MenuForm";
import { formatCurrency } from "@/function";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [orderId: string]: string | undefined };
}) {
  const menuId = Number(params.id);
  const orderId = searchParams.orderId;
  const [menu, menuAddonCategory, addonCategory, addon] = await Promise.all([
    fetchMenuWithId(menuId),
    fetchMenuAddonCategory(),
    fetchAddonCategory(),
    fetchAddon(),
  ]);

  const order = orderId ? await fetchOrderWithItemId(orderId) : null;

  const validAddonCat = menuAddonCategory
    .filter((item) => item.menuId === menuId)
    .map((menuAddonCat) => menuAddonCat.addonCategoryId);
  const validAddonCategory = addonCategory.filter((item) =>
    validAddonCat.includes(item.id)
  );

  const menuPrice = menu && formatCurrency(menu.price);

  if (!menu) return <h1>There is no menu.</h1>;

  const addonIds = addon.map((item) => item.id);

  // Fetch addon prices directly in server component
  const menuAddonPairs = addonIds.map((addonId) => ({ menuId, addonId }));
  const pricesMap = await getAddonPricesForMenus(menuAddonPairs);

  // Convert Map to Record<number, number> format
  const addonPrices: Record<number, number> = {};
  addonIds.forEach((addonId) => {
    const key = `${menuId}-${addonId}`;
    addonPrices[addonId] = pricesMap.get(key) ?? 0;
  });

  return (
    <div className="pb-24 pt-2">
      <Card className="mb-3 max-h-80 bg-background">
        <div className="flex justify-center items-center overflow-hidden rounded-md w-full object-contain">
          <Image
            src={menu.assetUrl || "/default-menu.png"}
            alt="menu-image"
            width={1080}
            height={1080}
            className="h-full w-full"
            priority
          />
        </div>
        <div className="mt-2 flex flex-col mb-2 ml-2">
          <h2 className="text-primary text-lg">{menu.name}</h2>
          <span className="text-sm">{menu.description}</span>
          <span className="text-lg mt-2">{menuPrice}</span>
        </div>
      </Card>
      <Suspense>
        <MenuForm
          addon={addon}
          addonCategory={validAddonCategory}
          menuId={menu.id}
          order={order}
          addonPrices={addonPrices}
        />
      </Suspense>
    </div>
  );
}
