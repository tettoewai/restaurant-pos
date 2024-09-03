import { Order } from "@prisma/client";
import { fetchOrder } from "./app/lib/order/data";
import { config } from "./config";

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
