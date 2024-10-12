"use client";
import { $Enums, Order } from "@prisma/client";
import { useEffect, useState } from "react";

export function useLocation(shouldFetch: boolean) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldFetch) return; // Only fetch if the flag is true

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
  addons: string;
  menuId: number | undefined;
  quantity: number | undefined;
  status: $Enums.ORDERSTATUS | undefined;
  totalPrice: number | undefined;
  instruction: string | null | undefined;
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
    const quantity = validItem?.quantity;
    const status = validItem?.status;
    const totalPrice = validItem?.totalPrice;
    const instruction = validItem?.instruction;
    return {
      itemId: uniqueOrder,
      addons: JSON.stringify(validItems.map((item) => item.addonId ?? 0)),
      menuId,
      quantity,
      status,
      totalPrice,
      instruction,
    };
  });
  return orderData;
}
