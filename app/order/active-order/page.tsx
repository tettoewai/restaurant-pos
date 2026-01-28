"use client";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchFocCatAndFocMenuWithPromotionIds,
  fetchMenuWithIds,
  getAddonPricesForMenus,
} from "@/app/lib/backoffice/data";
import {
  fetchCanceledOrders,
  fetchOrder,
  fetchPromotionMenuWithPromotionIds,
  fetchPromotionUsage,
  fetchPromotionWithTableId,
} from "@/app/lib/order/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MoreOptionButton from "@/components/MoreOptionButton";
import { calculateApplicablePromotions, formatCurrency } from "@/function";
import { formatOrder, getTotalOrderPrice } from "@/general";
import { Button, Card } from "@heroui/react";
import { DiscountType, Order, OrderStatus } from "@prisma/client";
import { CartCross } from "@solar-icons/react/ssr";
import Head from "next/head";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useSocket } from "@/context/SocketContext";
import FocPromotion from "../components/FocPromotion";
import NoticeCancelDialog from "../components/NoticeCancelDialog";

function ActiveOrderContent() {
  const searchParams = useSearchParams();
  const tableId = Number(searchParams.get("tableId"));
  const router = useRouter();
  const { channel, isConnected } = useSocket();

  // Use SWR for real-time polling with refreshInterval
  const { data: orders = [], isLoading } = useSWR(
    tableId ? [`active-orders-${tableId}`, tableId] : null,
    ([, id]) => fetchOrder(id),
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Also listen to real-time changes via socket for immediate updates
  useEffect(() => {
    if (!channel || !isConnected || !tableId) return;

    const handleStatusChange = async (payload: any) => {
      // Check if the change is for this table
      if (payload.new?.tableId === tableId || payload.old?.tableId === tableId) {
        // Trigger SWR revalidation on real-time changes for immediate updates
        mutate([`active-orders-${tableId}`, tableId]);
      }
    };

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'order' }, handleStatusChange);

    return () => {
      // Cleanup is handled by channel unsubscribe in SocketContext
      // The channel.on() listeners are automatically cleaned up when channel is unsubscribed
    };
  }, [channel, isConnected, tableId]);

  const { data: promotionUsage } = useSWR(
    orders && tableId && orders.length ? "promotionUsage" : null,
    () =>
      orders && orders.length
        ? fetchPromotionUsage({ tableId, orderSeq: orders[0].orderSeq })
        : Promise.resolve([])
  );

  const canceledOrder = orders
    ? orders
      .filter((item) => item.status === "CANCELED")
      .map((item) => item.itemId)
    : [""];

  const { data: canceledOrderData } = useSWR(
    canceledOrder ? [canceledOrder] : null,
    () => fetchCanceledOrders(canceledOrder)
  );

  const filteredOrders = orders?.filter((item) => {
    if (canceledOrderData && canceledOrderData.length) {
      const validCanceledOrder = canceledOrderData.find(
        (order) => order.itemId === item.itemId
      );
      if (validCanceledOrder && validCanceledOrder.userKnow) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  });

  const menuIds = filteredOrders
    ?.map((item) => item.menuId)
    .reduce((acc: number[], id) => {
      if (id && !acc.includes(id)) {
        acc.push(id);
      }
      return acc;
    }, []);
  const addonIds = filteredOrders
    ?.map((item) => item.addonId)
    .filter((item) => item !== null);
  const uniqueAddons: number[] =
    addonIds && addonIds.length ? Array.from(new Set(addonIds?.flat())) : [];

  const {
    data: menus,
    error: menuError,
    isLoading: menuLoading,
  } = useSWR(menuIds && menuIds.length > 0 ? [menuIds] : null, () =>
    menuIds && menuIds.length ? fetchMenuWithIds(menuIds) : Promise.resolve([])
  );

  const {
    data: addons,
    error: addonError,
    isLoading: addonLoading,
  } = useSWR([filteredOrders], () =>
    uniqueAddons.length ? fetchAddonWithIds(uniqueAddons) : Promise.resolve([])
  );

  const orderData =
    filteredOrders && filteredOrders?.length > 0 && menus && menus.length > 0
      ? formatOrder({ orders: filteredOrders, menus, addons })
      : [];

  const {
    data: promotions,
    error: promotionError,
    isLoading: promotionLoading,
  } = useSWR(tableId ? [`promotions-${tableId}`] : null, () =>
    fetchPromotionWithTableId(tableId)
  );

  const promotionIds = promotions ? promotions.map((item) => item.id) : [];

  const { data: promotionMenus } = useSWR(
    promotionIds && promotionIds.length ? [promotionIds] : null,
    () => fetchPromotionMenuWithPromotionIds(promotionIds)
  );

  const addonCategoryIds =
    addons && addons?.length > 0
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

  // Fetch menu-specific addon prices for all orders
  const { data: menuAddonPrices } = useSWR(
    orderData && orderData.length > 0
      ? [
        "menu-addon-prices",
        orderData.map((order) => ({
          menuId: order.menu?.id,
          addonIds: order.addons?.map((a) => a.id) || [],
        })),
      ]
      : null,
    async ([, orders]: [string, Array<{ menuId?: number; addonIds: number[] }>]) => {
      const priceMap = new Map<string, number>();
      const menuAddonPairs: { menuId: number; addonId: number }[] = [];

      orders.forEach((order) => {
        if (order.menuId) {
          order.addonIds.forEach((addonId) => {
            menuAddonPairs.push({ menuId: order.menuId!, addonId });
          });
        }
      });

      if (menuAddonPairs.length > 0) {
        const prices = await getAddonPricesForMenus(menuAddonPairs);
        prices.forEach((price, key) => {
          priceMap.set(key, price);
        });
      }

      return priceMap;
    },
    { revalidateOnFocus: false }
  );

  const orderDataForTotalPrice = orderData.filter((item) => !item.isFoc);

  const totalPrice = getTotalOrderPrice({
    orders: orderDataForTotalPrice,
    menuAddonPrices: menuAddonPrices,
  });

  const confirmedOrder = orderDataForTotalPrice.filter(
    (item) =>
      item.status !== OrderStatus.PENDING &&
      item.status !== OrderStatus.CANCELED
  );
  const confirmedTotalPrice = getTotalOrderPrice({
    orders: confirmedOrder,
    menuAddonPrices: menuAddonPrices,
  });

  const menuOrderData = orderData.reduce(
    (
      acc: Record<number, { menuId: number; quantity: number }>,
      { menu, quantity, status }
    ) => {
      if (status === OrderStatus.PENDING || status === OrderStatus.CANCELED) {
        return acc;
      }
      if (menu && !acc[menu.id]) {
        acc[menu.id] = { menuId: menu.id, quantity: 0 };
      }
      if (menu && menu.id && quantity) {
        acc[menu.id] = {
          menuId: menu.id,
          quantity: acc[menu.id].quantity + quantity,
        };
      }
      return acc;
    },
    {}
  );

  const applicablePromotion = Object.values(
    calculateApplicablePromotions({
      promotionMenus,
      promotions,
      menuOrderData,
      totalPrice: confirmedTotalPrice,
      promotionUsage,
    })?.reduce((acc: any, promotion) => {
      const groupName = promotion.group?.toLowerCase() || promotion.name;
      if (!acc[groupName]) {
        acc[groupName] = promotion;
      }
      return acc;
    }, {}) || []
  );

  const discountApplicablePromo = applicablePromotion.filter(
    (item: any) => item.discount_value
  );
  const discountedPrice = discountApplicablePromo.reduce(
    (acc: number, promo: any) => {
      if (promo.discount_type === DiscountType.FIXED_AMOUNT) {
        return (acc += promo.discount_value);
      }
      if (promo.discount_type === DiscountType.PERCENTAGE && totalPrice) {
        const value = (totalPrice / 100) * promo.discount_value;
        return (acc += value);
      }
    },
    0
  );

  const focPromotions = applicablePromotion.filter(
    (item: any) => item.discount_type === DiscountType.FOCMENU
  );

  const focPromotionIds = focPromotions.map((item: any) => item.id);

  const { data: focData } = useSWR(
    focPromotionIds.length ? `focCategory - ${focPromotionIds}` : null,
    () => fetchFocCatAndFocMenuWithPromotionIds(focPromotionIds)
  );

  const focDataMenuIds =
    focData?.focMenu
      .map((item) => item.menuId)
      .reduce((acc: number[], id) => {
        if (!acc.includes(id) && !menuIds?.includes(id)) {
          acc.push(id);
        }
        return acc;
      }, []) || [];

  const { data: focMenus } = useSWR(
    focDataMenuIds ? `focMenus-${[focDataMenuIds]}` : null,
    () => fetchMenuWithIds(focDataMenuIds)
  );

  const allMenus = (focMenus && menus && menus.concat(focMenus)) || menus;

  if (menuError || addonError || promotionError) {
    return (
      <div className="flex items-center justify-center mt-36 w-full">
        <Card className="bg-background flex flex-col items-center justify-center w-4/5 p-4">
          <span className="text-red-500">
            Something went wrong. Please try again later.
          </span>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order | Restaurant POS</title>
        <meta
          name="description"
          content="Order food online with ease. Our restaurant system lets customers browse menus, place orders, and track them in real-time."
        />
      </Head>
      <div className="pb-3">
        {orderData && orderData.length > 0 ? (
          <div className="p-1 w-full">
            <div className="flex justify-between w-full p-1 mt-1">
              <span>Your orders</span>
              {totalPrice ? (
                <span>
                  Total price:{" "}
                  {totalPrice && discountedPrice
                    ? `${totalPrice}-${discountedPrice} = ${formatCurrency(
                      totalPrice - discountedPrice
                    )}`
                    : totalPrice
                      ? formatCurrency(totalPrice)
                      : null}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full mt-4">
              {orderData.map((item) => {
                const unseenCanceledOrder =
                  canceledOrderData &&
                  canceledOrderData.length &&
                  canceledOrderData.find(
                    (order) => order.itemId === item.itemId
                  );
                if (!item.menu) return null;
                return (
                  <div key={item.itemId}>
                    {isLoading &&
                      menuLoading &&
                      addonLoading &&
                      addonCatLoading &&
                      promotionLoading ? (
                      <MenuLoading />
                    ) : (
                      <Card
                        className={`w-[11em] h-60 bg-background relative ${item.isFoc ? "border-primary border-1" : ""
                          }`}
                      >
                        {item.isFoc ? (
                          <div className="w-12 h-12 -scale-x-100 absolute right-0 top-0">
                            <Image
                              src="/ribbon_cornor.png"
                              alt="ribbon cornor"
                              width={1080}
                              height={1080}
                              className="w-full h-full"
                            />
                          </div>
                        ) : null}
                        <div className="h-1/2 w-full overflow-hidden flex items-center justify-center">
                          {item.status === "PENDING" && !item.isFoc ? (
                            <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
                              <MoreOptionButton
                                id={item.menu.id}
                                itemType="activeOrder"
                                orderData={item}
                                tableId={tableId}
                              />
                            </div>
                          ) : null}

                          <Image
                            src={item.menu.assetUrl || "/default-menu.png"}
                            alt="menu"
                            width={500}
                            height={500}
                            className=" w-full h-auto object-contain"
                          />
                        </div>
                        <div className="px-1 flex justify-between flex-col h-1/2 mb-2">
                          <div className="flex justify-between mt-1">
                            <span>{item.menu.name}</span>
                            <span className="size-6 text-white rounded-full bg-primary text-center">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="text-xs font-thin mt-1">
                            {item.addons && item.addons.length > 0
                              ? item.addons?.map((addon) => {
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
                              })
                              : ""}
                          </div>
                          <div className="text-sm font-thin mt-1 flex justify-between items-center">
                            <span>Status :</span>
                            <span
                              className={`font-bold flex items-center justify-center ${item.status === OrderStatus.PENDING
                                ? "text-red-500"
                                : item.status === OrderStatus.COMPLETE
                                  ? "text-green-500"
                                  : item.status === OrderStatus.COOKING
                                    ? "text-orange-500"
                                    : item.status === OrderStatus.CANCELED
                                      ? "text-gray-500"
                                      : ""
                                }`}
                            >
                              {item.status}
                              {unseenCanceledOrder &&
                                !unseenCanceledOrder.userKnow ? (
                                <NoticeCancelDialog
                                  id={unseenCanceledOrder.id}
                                  reason={unseenCanceledOrder.reason}
                                  tableId={tableId}
                                  canceledOrder={canceledOrder}
                                />
                              ) : null}
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
              <CartCross className="size-12 text-primary mb-4" />
              <span>Hungry?</span>
              <span className="text-sm">You have not ordered anything!</span>
              <Button
                className="bg-primary mt-4 text-white"
                onPress={() => router.push(`/order?tableId=${tableId}`)}
              >
                Browse
              </Button>
            </Card>
          </div>
        )}
        {focPromotions.length > 0 && focData && allMenus && (
          <FocPromotion
            focPromotions={focPromotions}
            focData={focData}
            allMenus={allMenus}
            tableId={tableId}
          />
        )}
      </div>
    </>
  );
}

export default function ActiveOrder() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-40 w-full">
          <span>Loading active orders...</span>
        </div>
      }
    >
      <ActiveOrderContent />
    </Suspense>
  );
}
