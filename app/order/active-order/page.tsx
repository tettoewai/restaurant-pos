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
  fetchPromotionWithTableId,
} from "@/app/lib/order/data";
import { MenuLoading } from "@/app/ui/skeletons";
import MoreOptionButton from "@/components/MoreOptionButton";
import { calculateApplicablePromotions, formatCurrency } from "@/function";
import { formatOrder, getTotalOrderPrice } from "@/general";
import { Button, Card, Checkbox, cn, Link } from "@nextui-org/react";
import { DISCOUNT, Order, ORDERSTATUS } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BsCartX } from "react-icons/bs";
import useSWR from "swr";
import NoticeCancelDialog from "../components/NoticeCancelDialog";
import FocPromotion from "../components/FocPromotion";

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

  const orderData =
    filteredOrders && filteredOrders?.length > 0
      ? formatOrder(filteredOrders)
      : [];
  const menuIds = orderData
    ?.map((item) => item.menuId)
    .reduce((acc: number[], id) => {
      if (id && !acc.includes(id)) {
        acc.push(id);
      }
      return acc;
    }, []);
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
  } = useSWR(menuIds.length > 0 ? [menuIds] : null, () =>
    fetchMenuWithIds(menuIds)
  );

  const {
    data: promotions,
    error: promotionError,
    isLoading: promotionLoading,
  } = useSWR(tableId ? [`promotions-${tableId}`] : null, () =>
    fetchPromotionWithTableId(tableId)
  );

  const {
    data: addons,
    error: addonError,
    isLoading: addonLoading,
  } = useSWR([orderData], () =>
    uniqueAddons.length ? fetchAddonWithIds(uniqueAddons) : Promise.resolve([])
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

  const totalPrice = addons && getTotalOrderPrice({ orderData, menus, addons });

  const menuOrderData = orderData.reduce(
    (
      acc: Record<number, { menuId: number; quantity: number }>,
      { menuId, quantity, status }
    ) => {
      if (status === ORDERSTATUS.PENDING || status === ORDERSTATUS.CANCELED) {
        return [];
      }
      if (menuId && !acc[menuId]) {
        acc[menuId] = { menuId, quantity: 0 };
      }
      if (menuId && quantity) {
        acc[menuId] = { menuId, quantity: acc[menuId].quantity + quantity };
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
      totalPrice,
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

  const focDataMenuIds = focData?.focMenu
    .map((item) => item.menuId)
    .reduce((acc: number[], id) => {
      if (!acc.includes(id) && !menuIds.includes(id)) {
        acc.push(id);
      }
      return acc;
    }, []);

  const { data: focMenus } = useSWR(
    focDataMenuIds && focDataMenuIds.length > 0 ? [focDataMenuIds] : null,
    () => focDataMenuIds && fetchMenuWithIds(focDataMenuIds)
  );

  const allMenus = focMenus && menus && menus.concat(focMenus);

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
    <div className="mb-3">
      {orderData && orderData.length > 0 ? (
        <div className="p-1 w-full">
          <div className="flex justify-between w-full p-1 mt-1">
            <span>Your orders</span>
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
              const unseenCanceledOrder =
                canceledOrderData &&
                canceledOrderData.length &&
                canceledOrderData.find((order) => order.itemId === item.itemId);
              if (!validMenu) return null;
              return (
                <div key={item.itemId}>
                  {orderLoading &&
                  menuLoading &&
                  addonLoading &&
                  addonCatLoading &&
                  promotionLoading ? (
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
            <Link href={`/order?tableId=${tableId}`}>
              <Button className="bg-primary mt-4 text-white">Browse</Button>
            </Link>
          </Card>
        </div>
      )}
      {focPromotions.length > 0 && focData && allMenus && (
        <FocPromotion
          focPromotions={focPromotions}
          focData={focData}
          allMenus={allMenus}
        />
      )}
    </div>
  );
}

export default ActiveOrder;
