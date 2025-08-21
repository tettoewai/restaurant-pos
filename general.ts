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
}

export interface PaidData extends OrderData {
  receiptCode: string;
  tableId: number;
  tax?: number;
  qrCode?: string;
  subTotal?: number;
  date?: Date;
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
}: {
  orders: OrderData[] | undefined;
}) => {
  if (!orders) return 0;
  return orders.reduce((total, order) => {
    const menuPrice = order.menu?.price || 0;
    const addonPrices =
      order.addons && order.addons.length
        ? order.addons.reduce((accu, curr) => (curr.price || 0) + accu, 0)
        : 0;
    const orderTotal =
      menuPrice && order.quantity
        ? (menuPrice + addonPrices) * order.quantity
        : 0;

    return total + orderTotal;
  }, 0);
};
