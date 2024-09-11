"use server";
import { CartItem } from "@/context/OrderContext";
import { prisma } from "@/db";
import { ORDERSTATUS } from "@prisma/client";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { fetchAddonWithIds, fetchMenuWithId } from "../backoffice/data";
import { revalidatePath } from "next/cache";

export const getTotalPrice = async (cartItem: CartItem[]) => {
  const totalPrice = await Promise.all(
    cartItem.map(async (item) => {
      const currentMenuPrice = (await fetchMenuWithId(item.menuId))
        ?.price as number;
      const currentAddonPrice = (await fetchAddonWithIds(item.addons)).reduce(
        (accu, addon) => addon.price + accu,
        0
      );
      return (currentMenuPrice + currentAddonPrice) * item.quantity;
    })
  );
  return totalPrice.reduce((accu, price) => accu + price, 0);
};

export const createOrder = async ({
  tableId,
  cartItem,
}: {
  tableId: number;
  cartItem: CartItem[];
}) => {
  const isValid = tableId && cartItem.length > 0;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  const order = await prisma.order.findFirst({
    where: {
      tableId,
      status: {
        in: [ORDERSTATUS.COOKING, ORDERSTATUS.PENDING],
        notIn: [ORDERSTATUS.PAID],
      },
    },
  });
  const orderSeq = order ? order.orderSeq : nanoid(7);
  const originalTotalPrice = await getTotalPrice(cartItem);
  const totalPrice = order
    ? order.totalPrice + originalTotalPrice
    : originalTotalPrice;

  await Promise.all(
    cartItem.map(async (item) => {
      const hasAddon = item.addons.length > 0;
      if (hasAddon) {
        item.addons.map(
          async (addon) =>
            await prisma.order.create({
              data: {
                menuId: item.menuId,
                addonId: addon,
                itemId: item.id,
                quantity: item.quantity,
                orderSeq,
                status: ORDERSTATUS.PENDING,
                totalPrice,
                tableId,
              },
            })
        );
      } else {
        await prisma.order.create({
          data: {
            menuId: item.menuId,
            itemId: item.id,
            quantity: item.quantity,
            orderSeq,
            status: ORDERSTATUS.PENDING,
            totalPrice,
            tableId,
          },
        });
      }
    })
  );
  await prisma.order.updateMany({ where: { orderSeq }, data: { totalPrice } });
  await prisma.notification.create({
    data: { message: "There are new orders", tableId },
  });
  redirect(`/order/active-order?tableId=${tableId}`);
};
