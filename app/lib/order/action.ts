"use server";
import { CartItem } from "@/context/OrderContext";
import { prisma } from "@/db";
import { OrderStatus, Table } from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  fetchAddonWithIds,
  fetchMenuWithId,
  fetchOrderWithTableId,
  fetchTableWithId,
  getAddonPricesForMenus,
} from "../backoffice/data";
import {
  fetchAddonIngredientWithAddonIds,
  fetchMenuItemIngredientWithMenuIds,
  fetchWarehouseStock,
} from "../warehouse/data";
import { fetchOrderWithItemId } from "./data";

export const getTotalPrice = async (cartItem: CartItem[]) => {
  // Build menu-addon pairs for batch price fetching
  const menuAddonPairs: { menuId: number; addonId: number }[] = [];
  cartItem.forEach((item) => {
    item.addons.forEach((addonId) => {
      menuAddonPairs.push({ menuId: item.menuId, addonId });
    });
  });

  // Fetch all addon prices at once
  const addonPrices = await getAddonPricesForMenus(menuAddonPairs);

  const totalPrice = await Promise.all(
    cartItem.map(async (item) => {
      const currentMenuPrice = (await fetchMenuWithId(item.menuId))
        ?.price as number;

      // Calculate addon price using menu-specific prices
      const currentAddonPrice = item.addons.reduce((accu, addonId) => {
        const key = `${item.menuId}-${addonId}`;
        const price = addonPrices.get(key) || 0;
        return accu + price;
      }, 0);

      return (currentMenuPrice + currentAddonPrice) * item.quantity;
    })
  );
  return totalPrice.reduce((accu, price) => accu + price, 0);
};

async function validateCartStock(cartItem: CartItem[]) {
  if (!cartItem.length) {
    return {
      isValid: false,
      message: "Missing cart items for stock validation.",
    };
  }

  const menuIds = Array.from(new Set(cartItem.map((item) => item.menuId)));
  const addonIds = Array.from(new Set(cartItem.flatMap((item) => item.addons)));

  const [menuIngredients, addonIngredients, warehouseStocks] =
    await Promise.all([
      fetchMenuItemIngredientWithMenuIds(menuIds),
      addonIds.length
        ? fetchAddonIngredientWithAddonIds(addonIds)
        : Promise.resolve([]),
      fetchWarehouseStock(),
    ]);

  // Map of warehouse itemId -> required quantity for this cart
  const requiredMap = new Map<number, number>();

  for (const cart of cartItem) {
    // Menu ingredients
    const menuIngs = menuIngredients.filter(
      (ing) => ing.menuId === cart.menuId
    );
    for (const ing of menuIngs) {
      const prev = requiredMap.get(ing.itemId) ?? 0;
      requiredMap.set(ing.itemId, prev + ing.quantity * cart.quantity);
    }

    // Addon ingredients
    for (const addonId of cart.addons) {
      const addonIngs = addonIngredients.filter(
        (ing) =>
          ing.addonId === addonId &&
          (ing.menuId === null || ing.menuId === cart.menuId)
      );

      for (const ing of addonIngs) {
        const prev = requiredMap.get(ing.itemId) ?? 0;
        requiredMap.set(ing.itemId, prev + ing.extraQty * cart.quantity);
      }
    }
  }

  let error: { isValid: false; message: string } | null = null;

  requiredMap.forEach((requiredQty, itemId) => {
    if (error) return;
    const stockRecord = warehouseStocks.find(
      (stock) => stock.itemId === itemId
    );
    const stockQty = stockRecord?.quantity ?? 0;

    if (stockQty < requiredQty) {
      error = {
        isValid: false,
        message: "Insufficient ingredient stock for this order.",
      };
    }
  });

  if (error) return error;
  return { isValid: true };
}

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

  const stockValidation = await validateCartStock(cartItem);
  if (!stockValidation.isValid) {
    return {
      message: stockValidation.message,
      isSuccess: false,
    };
  }

  try {
    // Check for an existing order
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: {
          notIn: [OrderStatus.PAID],
        },
        isArchived: false,
      },
    });

    const orderSeq = existingOrder ? existingOrder.orderSeq : nanoid(7);
    const originalTotalPrice = await getTotalPrice(cartItem);

    let totalPrice = originalTotalPrice;
    if (existingOrder) {
      totalPrice += existingOrder.totalPrice;
    }

    // Map all the cart items and create orders
    const orderPromises = cartItem.map(async (item) => {
      if (item.addons.length > 0) {
        // Handle the case where there are addons
        return Promise.all(
          item.addons.map(async (addon) => {
            await prisma.order.create({
              data: {
                menuId: item.menuId,
                addonId: addon,
                itemId: item.id,
                quantity: item.quantity,
                orderSeq,
                status: OrderStatus.PENDING,
                totalPrice,
                tableId,
                instruction: item.instruction,
                isFoc: item.isFoc,
                subTotal: item.subTotal,
              },
            });
          })
        );
      } else {
        // Handle case with no addons
        await prisma.order.create({
          data: {
            menuId: item.menuId,
            itemId: item.id,
            quantity: item.quantity,
            orderSeq,
            status: OrderStatus.PENDING,
            totalPrice,
            tableId,
            instruction: item.instruction,
            isFoc: item.isFoc,
            subTotal: item.subTotal,
          },
        });
      }
    });

    // Await the creation of all orders
    await Promise.all(orderPromises);

    // Update the total price for all the orders with the same orderSeq
    await prisma.order.updateMany({
      where: { orderSeq },
      data: { totalPrice },
    });

    // Create a notification for new orders
    await prisma.notification.create({
      data: { message: "There are new orders", tableId },
    });

    revalidatePath("/order");
    return {
      message: "Successfuly placed your orders.",
      isSuccess: true,
      orderSeq,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating order",
      isSuccess: false,
    };
  }
};

export const createFocOrder = async ({
  tableId,
  cartItem,
  promotionId,
}: {
  tableId: number;
  cartItem: CartItem[];
  promotionId: number;
}) => {
  const isAllFoc = cartItem.every((item) => item.isFoc === true);
  if (!tableId && !cartItem.length && !isAllFoc)
    return { message: "Missing required fields", isSuccess: false };
  try {
    const { orderSeq, isSuccess } = await createOrder({ tableId, cartItem });

    if (isSuccess && orderSeq) {
      await prisma.promotionUsage.create({
        data: { promotionId, tableId, orderSeq },
      });
    }
    revalidatePath("/order/active-order");
    return {
      message: "Successfuly placed your foc orders.",
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating foc order",
      isSuccess: false,
    };
  }
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
    await prisma.order.updateMany({
      where: { itemId },
      data: { instruction, quantity },
    });
    const menuId = prevOrder[0].menuId;
    const toRemove = prevAddon
      .filter((item) => !addons.includes(Number(item)))
      .filter((item) => item !== null);
    if (toRemove.length > 0) {
      const removePairs = toRemove.map((addonId) => ({
        menuId,
        addonId: Number(addonId),
      }));
      const removedPrices = await getAddonPricesForMenus(removePairs);
      const removedPrice = toRemove.reduce((accu, addonId) => {
        const key = `${menuId}-${Number(addonId)}`;
        return accu + (removedPrices.get(key) || 0);
      }, 0);
      newPrice -= removedPrice;
      if (prevOrder.length === 1 && !addons.length) {
        await prisma.order.update({
          where: { id: prevOrder[0].id },
          data: { addonId: null },
        });
      } else {
        await prisma.order.deleteMany({
          where: { addonId: { in: toRemove }, itemId },
        });
      }
    }
    const toAdd = addons.filter((item) => !prevAddon.includes(item));
    if (toAdd.length > 0) {
      const addPairs = toAdd.map((addonId) => ({ menuId, addonId }));
      const addedPrices = await getAddonPricesForMenus(addPairs);
      const addedPrice = toAdd.reduce((accu, addonId) => {
        const key = `${menuId}-${addonId}`;
        return accu + (addedPrices.get(key) || 0);
      }, 0);
      newPrice += addedPrice;
      if (!prevOrder[0].addonId) {
        await prisma.order.delete({ where: { id: prevOrder[0].id } });
      }

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
      where: { tableId, status: OrderStatus.PENDING },
      data: { totalPrice },
    });
    revalidatePath("/order");
    return { message: "Updated order successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating order!",
      isSuccess: false,
    };
  }
}

/**
 * Get addon prices for a menu (server action for client components)
 */
export async function getAddonPricesForMenu(
  menuId: number,
  addonIds: number[]
): Promise<Record<number, number>> {
  const priceMap: Record<number, number> = {};

  if (addonIds.length === 0) {
    return priceMap;
  }

  try {
    const menuAddonPairs = addonIds.map((addonId) => ({ menuId, addonId }));

    const prices = await getAddonPricesForMenus(menuAddonPairs);

    addonIds.forEach((addonId) => {
      const key = `${menuId}-${addonId}`;
      const price = prices.get(key);
      priceMap[addonId] = price || 0;
    });
  } catch (error) {
    try {
      const addons = await fetchAddonWithIds(addonIds);
      addons.forEach((addon) => {
        priceMap[addon.id] = addon.price;
      });
    } catch {
      // Return empty object on error
    }
  }

  return priceMap;
}

export async function setKnownReceipt(code: string) {
  if (!code) return;
  try {
    await prisma.receipt.updateMany({
      where: { code },
      data: { userKnown: true },
    });
    return { message: "Viewed receipt", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong!",
      isSuccess: false,
    };
  }
}

/**
 * Calculate total order price with menu-specific addon prices
 */
export async function getTotalOrderPriceWithMenuPrices(
  orders: Array<{
    menuId: number | null;
    addonIds: number[];
    quantity: number;
  }>
): Promise<number> {
  if (!orders || orders.length === 0) return 0;

  // Build menu-addon pairs for batch price fetching
  const menuAddonPairs: { menuId: number; addonId: number }[] = [];
  orders.forEach((order) => {
    if (order.menuId) {
      order.addonIds.forEach((addonId) => {
        menuAddonPairs.push({ menuId: order.menuId!, addonId });
      });
    }
  });

  // Fetch all addon prices at once
  const addonPrices =
    menuAddonPairs.length > 0
      ? await getAddonPricesForMenus(menuAddonPairs)
      : new Map<string, number>();

  // Calculate total
  let total = 0;
  for (const order of orders) {
    if (!order.menuId || !order.quantity) continue;

    const menu = await fetchMenuWithId(order.menuId);
    if (!menu) continue;

    const menuPrice = menu.price;
    const addonPrice = order.addonIds.reduce((accu, addonId) => {
      const key = `${order.menuId}-${addonId}`;
      return accu + (addonPrices.get(key) || 0);
    }, 0);

    total += (menuPrice + addonPrice) * order.quantity;
  }

  return total;
}

export async function candelOrder(itemId: string) {
  if (!itemId) return { message: "Missing required fields", isSuccess: false };
  try {
    const currentOrder = await prisma.order.findMany({ where: { itemId } });
    await prisma.order.updateMany({
      where: { itemId },
      data: { isArchived: true },
    });

    const menuId = currentOrder[0].menuId;
    const addonIds = currentOrder
      .map((item) => item.addonId)
      .filter((item) => item !== null) as number[];

    // Fetch menu-specific addon prices
    let currentAddonPrice = 0;
    if (addonIds.length > 0) {
      const menuAddonPairs = addonIds.map((addonId) => ({ menuId, addonId }));
      const addonPrices = await getAddonPricesForMenus(menuAddonPairs);
      currentAddonPrice = addonIds.reduce((accu, addonId) => {
        const key = `${menuId}-${addonId}`;
        return accu + (addonPrices.get(key) || 0);
      }, 0);
    }

    const currentMenuPrice = Number((await fetchMenuWithId(menuId))?.price);

    const totalPrice =
      currentOrder[0].totalPrice -
      (currentMenuPrice + currentAddonPrice) * currentOrder[0].quantity;

    const currentSeq = currentOrder[0].orderSeq;

    await prisma.order.updateMany({
      where: { orderSeq: currentSeq },
      data: { totalPrice },
    });

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

export async function createFeedback(formData: FormData) {
  const receiptCode = formData.get("receiptCode") as string;
  const rate = Number(formData.get("rate"));
  const feedback = formData.get("feedback") as string;
  const checkExist = await prisma.rating.findFirst({ where: { receiptCode } });
  if (checkExist)
    return { message: "Your feedback is already posted.", isSuccess: false };
  const isValid = receiptCode && rate;
  if (!isValid) return { message: "Missing required fields", isSuccess: false };
  try {
    await prisma.rating.create({
      data: { rating: rate, receiptCode, feedback },
    });
    return { message: "Post feedback successfully", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating feedback!",
      isSuccess: false,
    };
  }
}

export async function changeTable({
  tableId,
  prevTableId,
}: {
  prevTableId: number;
  tableId: number;
}) {
  if (!tableId && !prevTableId)
    return { message: "Missing required field.", isSuccess: false };
  try {
    const prevTable = await fetchTableWithId(prevTableId);
    const table = await fetchTableWithId(tableId);
    const order = await fetchOrderWithTableId(tableId);
    if (order && order.length > 0)
      return { message: "This table is already taken.", isSuccess: false };
    await prisma.order.updateMany({
      where: { tableId: prevTableId, status: { not: OrderStatus.PAID } },
      data: { tableId: tableId },
    });
    await prisma.notification.create({
      data: {
        message: `Customer was changed ${prevTable?.name} to ${table?.name}`,
        tableId,
      },
    });
    revalidatePath("/order");
    return { message: "Changing table was successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while changing table!",
      isSuccess: false,
    };
  }
}

export async function setKnowCanceledOrder(id: number) {
  if (!id) return { message: "Missing required field.", isSuccess: false };
  try {
    await prisma.canceledOrder.update({
      where: { id },
      data: { userKnow: true },
    });
    revalidatePath("/order/active-order");
    return { message: "I know.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while seeing canceled order!",
      isSuccess: false,
    };
  }
}

export async function callService(table: Table) {
  if (!table) return { message: "Table is not provided.", isSuccess: false };
  try {
    await prisma.notification.create({
      data: { tableId: table.id, message: `Calling from ${table.name}` },
    });
    return {
      message: "Called successfully. Please wait a second ❤️.",
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong!",
      isSuccess: false,
    };
  }
}
