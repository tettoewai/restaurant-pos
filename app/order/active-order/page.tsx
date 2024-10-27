"use client";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
} from "@/app/lib/backoffice/data";
import { fetchOrder } from "@/app/lib/order/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MoreOptionButton from "@/components/MoreOptionButton";
import { formatOrder, getTotalOrderPrice } from "@/general";
import { Button, Card, Link } from "@nextui-org/react";
import { Order } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BsCartX } from "react-icons/bs";
import useSWR from "swr";
import { formatCurrency } from "../[id]/page";

function ActiveOrder() {
  const searchParams = useSearchParams();
  const tableId = Number(searchParams.get("tableId"));
  const {
    data: orders,
    error: orderError,
    isLoading: orderLoading,
  } = useSWR<Order[]>([tableId], () => fetchOrder(tableId).then((res) => res), {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const orderData = orders && formatOrder(orders);
  const menuIds = orderData?.map((item) => item.menuId) as number[];
  const itemAddon = orderData?.map((item) =>
    item.addons ? JSON.parse(item.addons) : []
  );
  const uniqueAddons: number[] = Array.from(new Set(itemAddon?.flat())).filter(
    (item) => item !== 0
  );

  const {
    data: menus,
    error: menuError,
    isLoading: menuLoading,
  } = useSWR([menuIds], () =>
    menuIds.length ? fetchMenuWithIds(menuIds) : Promise.resolve([])
  );

  const {
    data: addons,
    error: addonError,
    isLoading: addonLoading,
  } = useSWR([orderData], () =>
    uniqueAddons.length ? fetchAddonWithIds(uniqueAddons) : Promise.resolve([])
  );

  const addonCategoryIds = addons
    ? addons.map((item) => item.addonCategoryId)
    : [];

  const {
    data: addonCategory,
    error: addonCategoryError,
    isLoading: addonCatLoading,
  } = useSWR([addons], () =>
    addonCategoryIds?.length
      ? fetchAddonCategoryWithIds(addonCategoryIds)
      : Promise.resolve([])
  );
  const totalPrice = addons && getTotalOrderPrice({ orderData, menus, addons });
  return (
    <div>
      {orderData && orderData.length > 0 ? (
        <div className="p-1 w-full">
          <div className="flex justify-between w-full p-1 mt-1">
            <span>Your orders</span>
            {totalPrice && (
              <span>Total price: {formatCurrency(totalPrice)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full mt-4">
            {orderData.map((item) => {
              const validMenu = menus?.find(
                (mennu) => mennu.id === item.menuId
              );
              const addonIds: number[] = item.addons
                ? JSON.parse(item.addons)
                : [];
              const validAddon = addons?.filter((addon) =>
                addonIds.includes(addon.id)
              );
              if (!validMenu) return null;
              return (
                <div key={item.itemId}>
                  {orderLoading &&
                  menuLoading &&
                  addonLoading &&
                  addonCatLoading ? (
                    <MenuLoading />
                  ) : (
                    <Card className="w-[11em] h-60 bg-background">
                      <div className="h-1/2 w-full overflow-hidden flex items-center justify-center">
                        {item.status === "PENDING" ? (
                          <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
                            <MoreOptionButton
                              id={validMenu.id}
                              itemType="activeOrder"
                              orderData={item}
                              tableId={tableId}
                            />
                          </div>
                        ) : null}

                        <Image
                          src={validMenu.assetUrl || "/default-menu.png"}
                          alt="menu"
                          width={500}
                          height={500}
                          className=" w-full h-auto object-contain"
                        />
                      </div>
                      <div className="px-1 flex justify-between flex-col h-1/2 mb-2">
                        <div className="flex justify-between mt-1">
                          <span>{validMenu.name}</span>
                          <span className="size-6 text-white rounded-full bg-primary text-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="text-xs font-thin mt-1">
                          {validAddon?.map((addon) => {
                            const validAddonCat =
                              addonCategory &&
                              addonCategory.find(
                                (addonCat) =>
                                  addonCat.id === addon.addonCategoryId
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
                          <span
                            className={clsx({
                              "text-red-500": item.status === "PENDING",
                              "text-green-500": item.status === "COMPLETE",
                              "text-orange-500": item.status === "COOKING",
                            })}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center mt-36 w-full">
          <Card className="bg-background flex flex-col items-center justify-center w-4/5 p-4">
            <BsCartX className="size-12 text-primary mb-4" />
            <span>Hungry?</span>
            <span className="text-sm">You have not ordered anything!</span>
            <Link href={`/order?tableId=${tableId}`}>
              <Button className="bg-primary mt-4 text-white">Browse</Button>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ActiveOrder;
