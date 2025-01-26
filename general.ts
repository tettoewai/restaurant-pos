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
  addons?: string;
  menuId: number | undefined;
  quantity: number | undefined;
  status: $Enums.ORDERSTATUS | undefined;
  totalPrice: number | undefined;
  isFoc?: boolean;
  instruction: string | null | undefined;
}

export interface PaidData extends OrderData {
  receiptCode: string;
  tableId: number;
  tax?: number;
  qrCode?: string;
  date?: Date;
}

export function formatOrder(orders: Order[]): OrderData[] {
  const uniqueItem: string[] = [];
  orders.map((item) => {
    const isExist = uniqueItem.find((orderId) => orderId === item.itemId);
    if (!isExist) uniqueItem.push(item.itemId);
  });
  const orderData = uniqueItem.map((uniqueOrder, index) => {
    const validItems = orders.filter((item) => item.itemId === uniqueOrder);
    const validItem = orders.find((item) => item.itemId === uniqueOrder);
    const menuId = validItem?.menuId;
    const quantity = validItem && validItem.quantity - validItem.paidQuantity;
    const status = validItem?.status;
    const totalPrice = validItem?.totalPrice;
    const instruction = validItem?.instruction;
    const isFoc = Boolean(validItem?.isFoc);
    const addons = validItems
      .map((item) => item.addonId)
      .filter((item) => item !== null);
    if (addons.length > 0) {
      return {
        itemId: uniqueOrder,
        addons: JSON.stringify(addons),
        menuId,
        quantity,
        status,
        totalPrice,
        instruction,
        isFoc,
      };
    } else {
      return {
        itemId: uniqueOrder,
        menuId,
        quantity,
        status,
        totalPrice,
        instruction,
        isFoc,
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
  menus,
  addons,
}: {
  orders: OrderData[] | undefined;
  menus: Menu[] | undefined;
  addons?: Addon[];
}) => {
  if (!orders || !menus) return 0;
  return orders.reduce((total, order) => {
    const menu = menus.find((item) => order.menuId === item.id);
    const menuPrice = menu?.price || 0;
    const unpaidAddon = order.addons ? JSON.parse(order.addons) : [];
    const addonPrices =
      addons
        ?.filter((item) => unpaidAddon.includes(item.id))
        .reduce((accu, curr) => (curr.price || 0) + accu, 0) || 0;
    const orderTotal =
      menuPrice && order.quantity
        ? (menuPrice + addonPrices) * order.quantity
        : 0;

    return total + orderTotal;
  }, 0);
};
