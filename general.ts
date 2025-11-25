"use client";
import { $Enums, Addon, Menu, Order } from "@prisma/client";
import { useEffect, useState } from "react";

export function useLocation(shouldFetch: boolean) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldFetch) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [shouldFetch]);

  return { location, error, loading };
}

export interface OrderData {
  itemId: string;
  addons?: Addon[];
  menu: Menu | undefined;
  quantity: number | undefined;
  status: $Enums.OrderStatus | undefined;
  totalPrice: number | undefined;
  isFoc?: boolean;
  instruction: string | null | undefined;
  createdAt?: Date;
  orderSeq?: string | null;
}

export interface PaidData extends OrderData {
  receiptCode: string;
  tableId: number;
  tax?: number;
  qrCode?: string;
  subTotal?: number;
  date?: Date;
  discountAmount?: number;
}

export function formatOrder({
  orders,
  menus,
  addons,
}: {
  orders: Order[];
  menus: Menu[];
  addons?: Addon[];
}): OrderData[] {
  const uniqueItem: string[] = [];
  orders.map((item) => {
    const isExist = uniqueItem.find((orderId) => orderId === item.itemId);
    if (!isExist) uniqueItem.push(item.itemId);
  });
  const orderData = uniqueItem.map((uniqueOrder, index) => {
    const validItems = orders.filter((item) => item.itemId === uniqueOrder);
    const validItem = orders.find((item) => item.itemId === uniqueOrder);
    const menu = menus.find((item) => item.id === validItem?.menuId);
    const quantity = validItem && validItem.quantity - validItem.paidQuantity;
    const status = validItem?.status;
    const totalPrice = validItem?.totalPrice;
    const instruction = validItem?.instruction;
    const isFoc = Boolean(validItem?.isFoc);
    const addonIds = validItems
      .map((item) => item.addonId)
      .filter((item) => item !== null);
    if (addonIds && addonIds.length > 0 && addons && addons.length) {
      return {
        itemId: uniqueOrder,
        addons: addons.filter((item) => addonIds.includes(item.id)),
        menu,
        quantity,
        status,
        totalPrice,
        instruction,
        isFoc,
        createdAt: validItem?.createdAt,
        orderSeq: validItem?.orderSeq,
      };
    } else {
      return {
        itemId: uniqueOrder,
        menu,
        quantity,
        status,
        totalPrice,
        instruction,
        isFoc,
        createdAt: validItem?.createdAt,
        orderSeq: validItem?.orderSeq,
      };
    }
  });
  return orderData;
}

export const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getTotalOrderPrice = ({
  orders,
  menuAddonPrices,
}: {
  orders: OrderData[] | undefined;
  menuAddonPrices?: Map<string, number>; // Map of "menuId-addonId" -> price
}) => {
  if (!orders) return 0;
  return orders.reduce((total, order) => {
    const menuPrice = order.menu?.price || 0;
    const menuId = order.menu?.id;

    // Calculate addon prices using menu-specific prices if available
    const addonPrices =
      order.addons && order.addons.length
        ? order.addons.reduce((accu, curr) => {
            if (menuId && menuAddonPrices) {
              const key = `${menuId}-${curr.id}`;
              const customPrice = menuAddonPrices.get(key);
              if (customPrice !== undefined) {
                return accu + customPrice;
              }
            }
            return accu + (curr.price || 0);
          }, 0)
        : 0;
    const orderTotal =
      menuPrice && order.quantity
        ? (menuPrice + addonPrices) * order.quantity
        : 0;

    return total + orderTotal;
  }, 0);
};
