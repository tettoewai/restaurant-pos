"use server";
import { CartItem } from "@/context/OrderContext";
import { prisma } from "@/db";
import { ORDERSTATUS } from "@prisma/client";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import {
  fetchAddonWithIds,
  fetchMenuWithId,
  fetchMenuWithIds,
} from "../backoffice/data";
import { revalidatePath } from "next/cache";
import { fetchOrderWithItemId } from "./data";

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
                instruction: item.instruction,
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
            instruction: item.instruction,
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

export async function updateOrder(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const addons: number[] = JSON.parse(String(formData.get("addonIds")));
  const quantity = Number(formData.get("quantity"));
  const instruction = String(formData.get("instruction"));
  if (!itemId && quantity < 1)
    return { message: "Missing required fields", isSuccess: false };
  try {
    const prevOrder = await fetchOrderWithItemId(itemId);
    if (!prevOrder || prevOrder[0].status !== "PENDING")
      return { message: "This order is not in pending!", isSuccess: false };
    const tableId = prevOrder[0].tableId;
    const prevPrice = prevOrder[0].totalPrice / prevOrder[0].quantity;
    let newPrice = prevPrice;
    const prevAddon = prevOrder.map((item) => item.addonId);
    const toRemove = prevAddon
      .filter((item) => !addons.includes(Number(item)))
      .filter((item) => item !== null);
    if (toRemove.length > 0) {
      if (prevOrder.length > 1) {
        const removedPrice = (await fetchAddonWithIds(toRemove)).reduce(
          (accu, curr) => curr.price + accu,
          0
        );
        newPrice -= removedPrice;
        await prisma.order.deleteMany({
          where: { addonId: { in: toRemove }, itemId },
        });
      } else if (prevOrder.length === 1) {
        await prisma.order.updateMany({
          where: { itemId },
          data: { addonId: null },
        });
      }
    }
    const toAdd = addons.filter((item) => !prevAddon.includes(item));
    if (toAdd.length > 0) {
      const addedPrice = (await fetchAddonWithIds(toAdd)).reduce(
        (accu, curr) => curr.price + accu,
        0
      );
      newPrice += addedPrice;
      await prisma.$transaction(
        toAdd.map((item) =>
          prisma.order.create({
            data: {
              menuId: prevOrder[0].menuId,
              addonId: item,
              itemId,
              quantity,
              orderSeq: prevOrder[0].orderSeq,
              status: prevOrder[0].status,
              totalPrice: prevOrder[0].totalPrice,
              tableId,
              isArchived: false,
              instruction,
            },
          })
        )
      );
    }
    const totalPrice = newPrice * quantity;
    await prisma.order.updateMany({
      where: { tableId, status: ORDERSTATUS.PENDING },
      data: { totalPrice, quantity },
    });
    return { message: "Updated order successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating order",
      isSuccess: false,
    };
  }
}

export async function candelOrder(itemId: string) {
  if (!itemId) return { message: "Missing required fields", isSuccess: false };
  try {
    const currentOrder = await prisma.order.findMany({ where: { itemId } });
    // await prisma.order.updateMany({
    //   where: { itemId },
    //   data: { isArchived: true },
    // });

    const currentAddonPrice = (
      await fetchAddonWithIds(
        currentOrder.map((item) => item.addonId).filter((item) => item !== null)
      )
    ).reduce((accu, curr) => curr.price + accu, 0);
    const currentMenuPrice = Number(
      (await fetchMenuWithId(currentOrder[0].menuId))?.price
    );

    const totalPrice =
      currentMenuPrice + currentAddonPrice * currentOrder[0].quantity;

    revalidatePath("/order/active-order");
    return { message: "Cancel order successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while canceling order",
      isSuccess: false,
    };
  }
}
