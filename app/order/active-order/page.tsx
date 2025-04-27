"use client";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchFocCatAndFocMenuWithPromotionIds,
  fetchMenuWithIds,
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
import { Button, Card, Link } from "@heroui/react";
import { DISCOUNT, Order, ORDERSTATUS } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BsCartX } from "react-icons/bs";
import useSWR from "swr";
import FocPromotion from "../components/FocPromotion";
import NoticeCancelDialog from "../components/NoticeCancelDialog";

function ActiveOrder() {
  const searchParams = useSearchParams();
  const tableId = Number(searchParams.get("tableId"));
  const router = useRouter();
  const {
    data: orders,
    error: orderError,
    isLoading: orderLoading,
  } = useSWR<Order[]>([tableId], () => fetchOrder(tableId).then((res) => res), {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

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

  const orderDataForTotalPrice = orderData.filter((item) => !item.isFoc);

  const totalPrice = getTotalOrderPrice({
    orders: orderDataForTotalPrice,
  });

  const confirmedOrder = orderDataForTotalPrice.filter(
    (item) =>
      item.status !== ORDERSTATUS.PENDING &&
      item.status !== ORDERSTATUS.CANCELED
  );
  const confirmedTotalPrice = getTotalOrderPrice({
    orders: confirmedOrder,
  });

  const menuOrderData = orderData.reduce(
    (
      acc: Record<number, { menuId: number; quantity: number }>,
      { menu, quantity, status }
    ) => {
      if (status === ORDERSTATUS.PENDING || status === ORDERSTATUS.CANCELED) {
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
      if (promo.discount_type === DISCOUNT.FIXED_AMOUNT) {
        return (acc += promo.discount_value);
      }
      if (promo.discount_type === DISCOUNT.PERCENTAGE && totalPrice) {
        const value = (totalPrice / 100) * promo.discount_value;
        return (acc += value);
      }
    },
    0
  );

  const focPromotions = applicablePromotion.filter(
    (item: any) => item.discount_type === DISCOUNT.FOCMENU
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

  if (orderError || menuError || addonError || promotionError) {
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
                canceledOrderData.find((order) => order.itemId === item.itemId);
              if (!item.menu) return null;
              return (
                <div key={item.itemId}>
                  {orderLoading &&
                  menuLoading &&
                  addonLoading &&
                  addonCatLoading &&
                  promotionLoading ? (
                    <MenuLoading />
                  ) : (
                    <Card
                      className={clsx("w-[11em] h-60 bg-background relative", {
                        "border-primary border-1": item.isFoc,
                      })}
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
                            className={clsx(
                              "font-bold flex items-center justify-center",
                              {
                                "text-red-500": item.status === "PENDING",
                                "text-green-500": item.status === "COMPLETE",
                                "text-orange-500": item.status === "COOKING",
                                "text-gray-500": item.status === "CANCELED",
                              }
                            )}
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
            <BsCartX className="size-12 text-primary mb-4" />
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
  );
}

export default ActiveOrder;
