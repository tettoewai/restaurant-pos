"use server";
import { prisma } from "@/db";
import { OrderStatus } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import {
  fetchAddonCategoryWithIds,
  fetchLocationWithId,
  fetchTableWithId,
} from "../backoffice/data";
import {
  fetchMenuItemIngredientWithMenuIds,
  fetchWarehouseStock,
  fetchAddonIngredients,
  fetchAddonIngredientWithAddonIds,
} from "../warehouse/data";

async function fetchDisabledLocationMenuCatIds(locationId: number) {
  noStore();
  try {
    const disabledLocationMenuCat =
      await prisma.disabledLocationMenuCategory.findMany({
        where: { locationId },
        select: { menuCategoryId: true },
      });
    return disabledLocationMenuCat.map((item) => item.menuCategoryId);
  } catch (error) {
    console.error("Error in disabledLocationMenuCat:", error);
    throw new Error("Failed to fetch disabledLocationMenuCat data.");
  }
}

async function fetchDisabledLocationMenuIds(locationId: number) {
  noStore();
  try {
    const disabledLocationMenu = await prisma.disabledLocationMenu.findMany({
      where: { locationId },
      select: { menuId: true },
    });
    return disabledLocationMenu.map((item) => item.menuId);
  } catch (error) {
    console.error("Error in disabledLocationMenu:", error);
    throw new Error("Failed to fetch disabledLocationMenu data.");
  }
}

export async function fetchMenuCategoryOrder(tableId: number) {
  noStore();
  try {
    const locationId = (await fetchTableWithId(tableId))?.locationId;
    if (!locationId) return [];

    const [location, disabledMenuCatIds] = await Promise.all([
      fetchLocationWithId(locationId),
      fetchDisabledLocationMenuCatIds(locationId),
    ]);

    const menuCategories = await prisma.menuCategory.findMany({
      where: { companyId: location?.companyId },
    });

    return menuCategories.filter(
      (item) => !disabledMenuCatIds.includes(item.id)
    );
  } catch (error) {
    console.error("Error in fetchMenuCategoryOrder:", error);
    throw new Error("Failed to fetch menu category data.");
  }
}

export async function fetchMenuCategoryMenuOrder(tableId: number) {
  noStore();
  try {
    const menuCategories = await fetchMenuCategoryOrder(tableId);
    if (!menuCategories.length) return [];

    const menuCategoryIds = menuCategories.map((item) => item.id);
    return prisma.menuCategoryMenu.findMany({
      where: { menuCategoryId: { in: menuCategoryIds } },
    });
  } catch (error) {
    console.error("Error in fetchMenuCategoryMenuOrder:", error);
    throw new Error("Failed to fetch menuCategoryMenu data.");
  }
}

/**
 * Check menu ingredient configuration and availability
 * Returns { hasIngredients: boolean, isOrderable: boolean }
 * - hasIngredients: true if menu has ingredients configured
 * - isOrderable: true if menu has ingredients AND sufficient stock available
 */
async function checkMenuAvailability(
  menuId: number,
  warehouseStocks: Awaited<ReturnType<typeof fetchWarehouseStock>>,
  reservedIngredients: Map<number, number>
): Promise<{ hasIngredients: boolean; isOrderable: boolean }> {
  // Get menu ingredients
  const menuIngredients = await fetchMenuItemIngredientWithMenuIds([menuId]);

  // Check if menu has ingredients configured
  if (menuIngredients.length === 0) {
    return { hasIngredients: false, isOrderable: false };
  }

  // Check each required ingredient for availability
  for (const ingredient of menuIngredients) {
    const currentStock =
      warehouseStocks.find((stock) => stock.itemId === ingredient.itemId)
        ?.quantity || 0;
    const reserved = reservedIngredients.get(ingredient.itemId) || 0;
    const availableStock = currentStock - reserved;

    // If available stock is less than required for one menu item, menu is not orderable
    if (availableStock < ingredient.quantity) {
      return { hasIngredients: true, isOrderable: false };
    }
  }

  return { hasIngredients: true, isOrderable: true };
}

/**
 * Check addon ingredient configuration and availability for a specific menu
 * Returns { hasIngredients: boolean, isOrderable: boolean }
 */
async function checkAddonAvailability(
  addonId: number,
  menuId: number,
  warehouseStocks: Awaited<ReturnType<typeof fetchWarehouseStock>>,
  reservedIngredients: Map<number, number>,
  addonIngredients: Awaited<ReturnType<typeof fetchAddonIngredients>>,
  addonNeedIngredient?: boolean
): Promise<{ hasIngredients: boolean; isOrderable: boolean }> {
  // If addon doesn't need ingredients, it's always orderable
  if (addonNeedIngredient === false) {
    return { hasIngredients: true, isOrderable: true };
  }

  // Find addon ingredients for this addon and menu combination
  const relevantIngredients = addonIngredients.filter(
    (ing) =>
      ing.addonId === addonId && (ing.menuId === null || ing.menuId === menuId)
  );

  // If addon needs ingredients but none are configured, it's not available
  if (addonNeedIngredient === true && relevantIngredients.length === 0) {
    return { hasIngredients: false, isOrderable: false };
  }

  // If no ingredients found and we don't know if it needs ingredients, assume it doesn't
  if (relevantIngredients.length === 0) {
    return { hasIngredients: true, isOrderable: true };
  }

  // Check each required ingredient for availability
  for (const ingredient of relevantIngredients) {
    const currentStock =
      warehouseStocks.find((stock) => stock.itemId === ingredient.itemId)
        ?.quantity || 0;
    const reserved = reservedIngredients.get(ingredient.itemId) || 0;
    const availableStock = currentStock - reserved;

    // If available stock is less than required extra quantity, addon is not orderable
    if (availableStock < ingredient.extraQty) {
      return { hasIngredients: true, isOrderable: false };
    }
  }

  return { hasIngredients: true, isOrderable: true };
}

/**
 * Calculate reserved ingredients from pending/cooking/complete orders
 * Returns a map of itemId -> total reserved quantity
 */
async function calculateReservedIngredients(
  locationId: number
): Promise<Map<number, number>> {
  const reservedMap = new Map<number, number>();

  try {
    // Fetch all active orders (PENDING)
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING],
        },
        isArchived: false,
      },
      include: {
        menu: true,
      },
    });

    if (activeOrders.length === 0) {
      return reservedMap;
    }

    // Get unique menu IDs and addon IDs from active orders
    const menuIdsSet = new Set<number>();
    const addonIdsSet = new Set<number>();

    activeOrders.forEach((order) => {
      menuIdsSet.add(order.menuId);
      if (order.addonId !== null) {
        addonIdsSet.add(order.addonId);
      }
    });

    const menuIds: number[] = [];
    menuIdsSet.forEach((id) => menuIds.push(id));

    const addonIds: number[] = [];
    addonIdsSet.forEach((id) => addonIds.push(id));

    // Fetch menu ingredients and addon ingredients
    const [menuIngredients, addonIngredients] = await Promise.all([
      fetchMenuItemIngredientWithMenuIds(menuIds),
      addonIds.length > 0
        ? fetchAddonIngredientWithAddonIds(addonIds)
        : Promise.resolve([]),
    ]);

    // Calculate reserved ingredients from menu items
    for (const order of activeOrders) {
      const menuIngs = menuIngredients.filter(
        (ing) => ing.menuId === order.menuId
      );
      for (const ingredient of menuIngs) {
        const currentReserved = reservedMap.get(ingredient.itemId) || 0;
        reservedMap.set(
          ingredient.itemId,
          currentReserved + ingredient.quantity * order.quantity
        );
      }
    }

    // Calculate reserved ingredients from addons
    for (const order of activeOrders) {
      if (order.addonId) {
        const addonIngs = addonIngredients.filter(
          (ing) =>
            ing.addonId === order.addonId &&
            (ing.menuId === null || ing.menuId === order.menuId)
        );
        for (const ingredient of addonIngs) {
          const currentReserved = reservedMap.get(ingredient.itemId) || 0;
          reservedMap.set(
            ingredient.itemId,
            currentReserved + ingredient.extraQty * order.quantity
          );
        }
      }
    }
  } catch (error) {
    console.error("Error calculating reserved ingredients:", error);
    // Return empty map on error - better to show menus than hide them all
  }

  return reservedMap;
}

export interface MenuWithAvailability {
  id: number;
  name: string;
  price: number;
  description: string | null;
  assetUrl: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyId: number;
  hasIngredients: boolean;
  isOrderable: boolean;
}

export async function fetchMenuOrder(tableId: number) {
  noStore();
  if (!tableId) return [];
  try {
    const locationId = (await fetchTableWithId(tableId))?.locationId;
    if (!locationId) return [];

    const [disabledMenuIds, menuCategoryMenus] = await Promise.all([
      fetchDisabledLocationMenuIds(locationId),
      fetchMenuCategoryMenuOrder(tableId),
    ]);

    const menuIds = menuCategoryMenus
      .map((item) => item.menuId)
      .filter((menuId) => !disabledMenuIds.includes(menuId));
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds }, isArchived: false },
      orderBy: { id: "asc" },
    });

    if (menus.length === 0) {
      return [];
    }

    // Fetch warehouse stock and calculate reserved ingredients
    const [warehouseStocks, reservedIngredients] = await Promise.all([
      fetchWarehouseStock().catch(() => []),
      calculateReservedIngredients(locationId),
    ]);

    // Check availability for each menu
    const menusWithAvailability = await Promise.all(
      menus.map(async (menu) => {
        const availability = await checkMenuAvailability(
          menu.id,
          warehouseStocks,
          reservedIngredients
        );

        // Hide menus without ingredients configured
        if (!availability.hasIngredients) {
          return null;
        }

        // Return menu with availability info
        return {
          ...menu,
          hasIngredients: availability.hasIngredients,
          isOrderable: availability.isOrderable,
        };
      })
    );

    // Filter out null values (menus without ingredients)
    return menusWithAvailability.filter(
      (menu): menu is NonNullable<typeof menu> => menu !== null
    ) as MenuWithAvailability[];
  } catch (error) {
    console.error("Error in fetchMenuOrder:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

/**
 * Fetch addon availability for a specific menu
 * Returns addon availability status for each addon
 */
export async function fetchAddonAvailability(
  menuId: number,
  addonIds: number[]
): Promise<Map<number, { hasIngredients: boolean; isOrderable: boolean }>> {
  noStore();
  const availabilityMap = new Map<
    number,
    { hasIngredients: boolean; isOrderable: boolean }
  >();

  if (addonIds.length === 0) {
    return availabilityMap;
  }

  try {
    // Fetch warehouse stock and calculate reserved ingredients
    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) return availabilityMap;

    // Get location from any order or we'll need to pass locationId
    // For now, let's calculate reserved ingredients without location filtering
    const reservedIngredients = await calculateReservedIngredients(0).catch(
      () => new Map()
    );
    const warehouseStocks = await fetchWarehouseStock().catch(() => []);
    const addonIngredients = await fetchAddonIngredients().catch(() => []);

    // Fetch addon details to check needIngredient flag
    const { fetchAddonWithIds } = await import("../backoffice/data");
    const addons = await fetchAddonWithIds(addonIds).catch(() => []);

    // Check availability for each addon
    await Promise.all(
      addonIds.map(async (addonId) => {
        const addon = addons.find((a) => a.id === addonId);
        const availability = await checkAddonAvailability(
          addonId,
          menuId,
          warehouseStocks,
          reservedIngredients,
          addonIngredients,
          addon?.needIngredient
        );
        availabilityMap.set(addonId, availability);
      })
    );
  } catch (error) {
    console.error("Error in fetchAddonAvailability:", error);
  }

  return availabilityMap;
}

export async function fetchOrder(tableId: number) {
  noStore();
  try {
    const order = await prisma.order.findMany({
      where: {
        tableId,
        status: { notIn: [OrderStatus.PAID] },
        isArchived: false,
      },
      orderBy: { createdAt: "asc" },
    });
    return order;
  } catch (error) {
    console.error("Error in fetchOrder:", error);
    throw new Error("Failed to fetch Order data.");
  }
}

export async function fetchLastPaidOrder(tableId: number) {
  noStore();
  try {
    const lastOrderSeq = await prisma.order.findFirst({
      where: { tableId },
      orderBy: { createdAt: "desc" },
      select: { orderSeq: true },
    });
    if (!lastOrderSeq) {
      return;
    }
    const lastOrderWithSameSeq = await prisma.order.findMany({
      where: { orderSeq: lastOrderSeq.orderSeq, paidQuantity: { gt: 0 } },
      select: { itemId: true },
    });
    return lastOrderWithSameSeq;
  } catch (error) {
    console.error("Error in fetchLastOrder:", error);
    throw new Error("Failed to fetch last Order data.");
  }
}

//for order
export async function fetchReceiptWithItemId({
  itemIds,
}: {
  itemIds: string[];
}) {
  if (!itemIds) return;

  noStore();

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    return await prisma.receipt.findMany({
      where: {
        itemId: { in: itemIds },
        userKnown: false,
        createdAt: {
          gte: thirtyMinutesAgo, // Filter records created in the last 30 minutes
        },
      },
    });
  } catch (error) {
    console.error("Error in fetchReceiptWithItemId:", error);
    throw new Error("Failed to fetch receipt data.");
  }
}

export async function fetchPromotionUsage({
  tableId,
  orderSeq,
}: {
  tableId: number;
  orderSeq: string;
}) {
  if (!tableId && !orderSeq) return [];
  noStore();
  try {
    return await prisma.promotionUsage.findMany({
      where: { tableId, orderSeq },
    });
  } catch (error) {
    console.error("Error in fetchPromotionUsage:", error);
    throw new Error("Failed to fetch promotion usage data.");
  }
}

export async function fetchOrderWithItemId(itemId: string) {
  noStore();
  try {
    const order = await prisma.order.findMany({ where: { itemId } });
    return order;
  } catch (error) {
    console.error("Error in fetchOrder:", error);
    throw new Error("Failed to fetch Order data.");
  }
}

export async function fetchReceiptWithCode(receitpCode: string) {
  noStore();
  try {
    return await prisma.receipt.findMany({
      where: { code: receitpCode },
    });
  } catch (error) {
    console.error("Error in fetchReceipt:", error);
    throw new Error("Failed to fetch Receipt data.");
  }
}

export async function fetchCompanyFromOrder(tableId: number) {
  noStore();
  try {
    const table = await fetchTableWithId(tableId);
    const location = table && (await fetchLocationWithId(table.locationId));
    return (
      location &&
      (await prisma.company.findFirst({ where: { id: location.companyId } }))
    );
  } catch (error) {
    console.error("Error in fetchCompanyFromOrder:", error);
    throw new Error("Failed to fetch company data.");
  }
}

export async function fetchCanceledOrders(itemId: string[]) {
  noStore();
  try {
    return await prisma.canceledOrder.findMany({
      where: { itemId: { in: itemId } },
    });
  } catch (error) {
    console.error("Error in fetchCanceledOrder:", error);
    throw new Error("Failed to fetch canceled data.");
  }
}

export async function fetchCanceledOrder(itemId: string) {
  noStore();
  try {
    return await prisma.canceledOrder.findFirst({
      where: { itemId },
    });
  } catch (error) {
    console.error("Error in fetchCanceledOrder:", error);
    throw new Error("Failed to fetch canceled data.");
  }
}

export async function fetchPromotionWithTableId(tableId: number) {
  noStore();
  try {
    const table = await fetchTableWithId(tableId);
    if (!table) return [];
    return await prisma.promotion.findMany({
      where: {
        locationId: table.locationId,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() },
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Error in fetchPromotion:", error);
    throw new Error("Failed to fetch promotion data.");
  }
}

export async function fetchMenuCategoryWithIds(ids: number[]) {
  noStore();
  try {
    return await prisma.menuCategory.findMany({ where: { id: { in: ids } } });
  } catch (error) {
    console.error("Error in menuCategory:", error);
    throw new Error("Failed to fetch menuCategory data.");
  }
}

export async function fetchPromotionMenuWithPromotionIds(ids: number[]) {
  noStore();
  try {
    return await prisma.promotionMenu.findMany({
      where: { promotionId: { in: ids } },
      orderBy: { quantity_required: "desc" },
    });
  } catch (error) {
    console.error("Error in fetchPromotionMenu:", error);
    throw new Error("Failed to fetch promotionMenu data.");
  }
}

export async function fetchFocMenuWithPromotiionId(promotionId: number) {
  noStore();
  try {
    const focCategory = await prisma.focCategory.findMany({
      where: { promotionId },
    });

    const focCategoryIds = focCategory.map((item) => item.id);

    const focMenu = await prisma.focMenu.findMany({
      where: { focCategoryId: { in: focCategoryIds } },
    });

    return { focCategory, focMenu };
  } catch (error) {
    console.error("Error in fetchFocMenu:", error);
    throw new Error("Failed to fetch focMenu data.");
  }
}

export async function fetchAddonCategoryWithMenuIds(menuIds: number[]) {
  noStore();
  try {
    const menuAddonCategory = await prisma.menuAddonCategory.findMany({
      where: { menuId: { in: menuIds } },
    });
    const addonCategoryIds = menuAddonCategory.map(
      (item) => item.addonCategoryId
    );
    const addonCategories = await fetchAddonCategoryWithIds(addonCategoryIds);
    return { addonCategories, menuAddonCategory };
  } catch (error) {
    console.error("Error in fetchAddonCategoryWithMenuId:", error);
    throw new Error("Failed to fetch AddonCategory data.");
  }
}

export async function fetchAddonCategoryMenuWithMenuIds(menuIds: number[]) {
  noStore();
  try {
    return await prisma.menuAddonCategory.findMany({
      where: { menuId: { in: menuIds } },
    });
  } catch (error) {
    console.error("Error in fetchAddonCategoryMenuWithMenuIds:", error);
    throw new Error("Failed to fetch menuAddonCategory data.");
  }
}

export async function fetchActiveOrderWithTableIds(tableIds: number[]) {
  noStore();
  try {
    return await prisma.order.findMany({
      where: {
        tableId: { in: tableIds },
        status: { notIn: [OrderStatus.PAID, OrderStatus.CANCELED] },
      },
    });
  } catch (error) {
    console.error("Error in fetchOrderWithTableIds:", error);
    throw new Error("Failed to fetch order with tableIds data.");
  }
}
