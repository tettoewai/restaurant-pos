"use client";
import { useEffect, useState } from "react";
import { Order } from "@prisma/client";

export function useLocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
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
  }, []);

  return { location, error, loading };
}

export function formatOrder(orders: Order[]) {
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
    return {
      itemId: uniqueOrder,
      addons: JSON.stringify(validItems.map((item) => item.addonId ?? 0)),
      menuId,
      quantity,
      status,
      totalPrice,
    };
  });
  return orderData;
}
