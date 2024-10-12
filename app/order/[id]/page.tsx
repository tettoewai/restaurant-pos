import { Card } from "@nextui-org/react";
import Image from "next/image";
import MenuForm from "../components/MenuForm";
import {
  fetchMenuWithId,
  fetchMenuAddonCategory,
  fetchAddonCategory,
  fetchAddon,
} from "@/app/lib/backoffice/data";
import { fetchOrderWithItemId } from "@/app/lib/order/data";
import { Suspense } from "react";

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

  return (
    <div>
      <div className="pb-24 mt-2">
        <Card className="mb-3 max-h-80 bg-background">
          <div className="flex justify-center items-center overflow-hidden rounded-md w-full object-contain">
            <Image
              src={menu?.assetUrl || "/default-menu.png"}
              alt="menu-image"
              width={1080}
              height={1080}
              className="h-full w-full"
              priority
            />
          </div>
          <div className="mt-2 flex flex-col mb-2 ml-2">
            <h2 className="text-primary text-lg">{menu?.name}</h2>
            <span className="text-sm">{menu?.description}</span>
            <span className="text-lg mt-2">{menu?.price} Kyats</span>
          </div>
        </Card>
        <Suspense>
          <MenuForm
            addon={addon}
            addonCategory={validAddonCategory}
            menuId={menuId}
            order={order}
          />
        </Suspense>
      </div>
    </div>
  );
}
