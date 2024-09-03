"use client";
import useSWR from "swr";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
} from "@/app/lib/backoffice/data";
import { fetchOrder } from "@/app/lib/order/data";
import { formatOrder } from "@/Generial";
import { Button, Card, Link } from "@nextui-org/react";
import { Addon, AddonCategory, Menu, Order } from "@prisma/client";
import Image from "next/image";
import { BsCartX } from "react-icons/bs";

function activeOrder({ searchParams }: { searchParams: { tableId: string } }) {
  const tableId = Number(searchParams.tableId);
  // Fetch orders with SWR
  const { data: orders = [], error: orderError } = useSWR<Order[]>(
    `orders`,
    () => fetchOrder(tableId),
    { refreshInterval: 10000 } // Fetch every 10 seconds
  );

  const orderData = formatOrder(orders);
  const menuIds = orderData.map((item) => item.menuId) as number[];
  const itemAddon: number[] = orderData.map((item) => JSON.parse(item.addons));
  const uniqueAddons: number[] = Array.from(new Set(itemAddon.flat())).filter(
    (item) => item !== 0
  );

  // Fetch menus, addons, and addon categories when orders change
  const { data: menus = [], error: menuError } = useSWR(
    menuIds.length ? "menus" : null,
    () => fetchMenuWithIds(menuIds)
  );

  const { data: addons = [], error: addonError } = useSWR(
    uniqueAddons.length ? "addons" : null,
    () => fetchAddonWithIds(uniqueAddons)
  );

  const addonCategoryIds = addons.map((item) => item.addonCategoryId);

  const { data: addonCategory = [], error: addonCategoryError } = useSWR(
    addonCategoryIds.length ? "addonCategory" : null,
    () => fetchAddonCategoryWithIds(addonCategoryIds)
  );

  return (
    <div>
      <div>
        {orderData.length > 0 ? (
          <div className="p-1 w-full">
            <div className="flex justify-between w-full p-1 mt-1">
              <span>Your orders</span>
              <span>Total price: {orderData[0].totalPrice} Ks</span>
            </div>
            <div className="flex flex-wrap p-1 mt-2 space-x-1">
              {orderData.map((item) => {
                const validMenu = menus.find(
                  (mennu) => mennu.id === item.menuId
                );
                const addonIds: number[] = JSON.parse(item.addons);
                const validAddon = addons.filter((addon) =>
                  addonIds.includes(addon.id)
                );
                return (
                  <Card key={item.itemId} className="w-48 min-h-60">
                    <div className="h-1/2 w-full overflow-hidden flex items-center justify-center">
                      <Image
                        src={validMenu?.assetUrl || "/default-menu.png"}
                        alt="menu"
                        width={500}
                        height={500}
                        className=" w-full h-auto object-contain"
                      />
                    </div>
                    <div className="px-1 flex justify-between flex-col h-1/2 mb-2">
                      <div className="flex justify-between mt-1">
                        <span>{validMenu?.name}</span>
                        <span className="size-6 text-white rounded-full bg-primary text-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-xs font-thin mt-1">
                        {validAddon.map((addon) => {
                          const validAddonCat = addonCategory.find(
                            (addonCat) => addonCat.id === addon.addonCategoryId
                          );
                          return (
                            <div
                              key={addon.id}
                              className="flex justify-between"
                            >
                              <span>{validAddonCat?.name}</span>
                              <span>{addon.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-sm font-thin mt-1 flex justify-between ">
                        <span>Status :</span>
                        <span> {item.status}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center mt-36 w-full">
            <Card className="bg-background flex flex-col items-center justify-center w-4/5 p-4">
              <BsCartX className="size-12 text-primary mb-4" />
              <span>Hungry?</span>
              <span className="text-sm">You haven't ordered anything!</span>
              <Link href={`/order?tableId=${tableId}`}>
                <Button className="bg-primary mt-4 text-white">Browse</Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default activeOrder;