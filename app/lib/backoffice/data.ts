"use server";
import { prisma } from "@/db";
import {
  MovementSource,
  MovementType,
  OrderStatus,
  POStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

export async function fetchUser() {
  noStore();
  try {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return null;

    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function fetchUserWithIds(ids: number[]) {
  noStore();
  if (!ids.length) return undefined;
  try {
    return prisma.user.findMany({ where: { id: { in: ids } } });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user data.");
  }
}

export async function fetchCompany() {
  noStore();
  try {
    const user = await fetchUser();
    const company = await prisma.company.findFirst({
      where: { id: user?.companyId },
    });
    return { company, user };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch company data.");
  }
}
export async function fetchMenuCategory() {
  noStore();
  try {
    const { company } = await fetchCompany();
    const menuCategory = await prisma.menuCategory.findMany({
      where: { companyId: company?.id, isArchived: false },
      orderBy: { id: "asc" },
    });
    return menuCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch menuCategory data.");
  }
}

export async function fetchMenuAddonCategory() {
  noStore();
  try {
    const menu = await fetchMenu();
    const menuIds = menu.map((item) => item.id);
    const menuAddonCategory = await prisma.menuAddonCategory.findMany({
      where: { menuId: { in: menuIds } },
      orderBy: { id: "asc" },
    });
    return menuAddonCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch menuAddonCategory data.");
  }
}

export async function fetchAddonCategory() {
  noStore();
  try {
    const menuAddonCategory = await fetchMenuAddonCategory();
    const addonCategoryIds = menuAddonCategory.map(
      (item) => item.addonCategoryId
    );
    const addonCategory = await prisma.addonCategory.findMany({
      where: { id: { in: addonCategoryIds }, isArchived: false },
      orderBy: { id: "asc" },
    });
    return addonCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addonCategory data.");
  }
}

export async function fetchAddon() {
  noStore();
  try {
    const addonCategory = await fetchAddonCategory();
    const addonCategoryIds = addonCategory.map((item) => item.id);
    const addon = await prisma.addon.findMany({
      where: { addonCategoryId: { in: addonCategoryIds }, isArchived: false },
      orderBy: { id: "asc" },
    });
    return addon;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addon data.");
  }
}

export async function fetchAddonWithId(id: number) {
  noStore();
  try {
    const addon = await prisma.addon.findFirst({
      where: { id },
    });
    return addon;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addon data.");
  }
}

export async function fetchAddonWithIds(ids: number[]) {
  noStore();
  try {
    const addon = await prisma.addon.findMany({
      where: { id: { in: ids } },
    });
    return addon;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addon data.");
  }
}

/**
 * Get addon price for a specific menu-addon combination
 * Returns menu-specific price if exists, otherwise returns default addon price
 */
export async function getAddonPriceForMenu(
  menuId: number,
  addonId: number
): Promise<number> {
  noStore();
  try {
    const menuAddonPrice = await prisma.menuAddonPrice.findUnique({
      where: {
        menuId_addonId: {
          menuId,
          addonId,
        },
      },
    });

    if (menuAddonPrice) {
      return menuAddonPrice.price;
    }

    // Fall back to default addon price
    const addon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { price: true },
    });

    return addon?.price || 0;
  } catch (error) {
    console.error("Database Error:", error);
    // Fall back to default addon price on error
    try {
      const addon = await prisma.addon.findUnique({
        where: { id: addonId },
        select: { price: true },
      });
      return addon?.price || 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Get addon prices for multiple menu-addon combinations
 * Returns a map of "menuId-addonId" -> price
 */
export async function getAddonPricesForMenus(
  menuAddonPairs: { menuId: number; addonId: number }[]
): Promise<Map<string, number>> {
  noStore();
  const priceMap = new Map<string, number>();

  if (menuAddonPairs.length === 0) return priceMap;

  try {
    // Fetch all menu-specific prices
    const menuAddonPrices = await prisma.menuAddonPrice.findMany({
      where: {
        OR: menuAddonPairs.map((pair) => ({
          menuId: pair.menuId,
          addonId: pair.addonId,
        })),
      },
    });

    // Get unique addon IDs to fetch default prices
    const addonIdsSet = new Set<number>();
    menuAddonPairs.forEach((p) => addonIdsSet.add(p.addonId));
    const addonIds: number[] = [];
    addonIdsSet.forEach((id) => addonIds.push(id));
    const addons = await prisma.addon.findMany({
      where: { id: { in: addonIds } },
      select: { id: true, price: true },
    });

    const defaultPrices = new Map<number, number>();
    addons.forEach((addon) => {
      defaultPrices.set(addon.id, addon.price);
    });

    // Build price map
    menuAddonPairs.forEach((pair) => {
      const key = `${pair.menuId}-${pair.addonId}`;
      const menuSpecificPrice = menuAddonPrices.find(
        (p) => p.menuId === pair.menuId && p.addonId === pair.addonId
      );

      if (menuSpecificPrice) {
        priceMap.set(key, menuSpecificPrice.price);
      } else {
        // Use default addon price
        const defaultPrice = defaultPrices.get(pair.addonId) || 0;
        priceMap.set(key, defaultPrice);
      }
    });

    return priceMap;
  } catch (error) {
    console.error("Database Error:", error);
    // Fall back to default prices
    try {
      const addonIdsSet = new Set<number>();
      menuAddonPairs.forEach((p) => addonIdsSet.add(p.addonId));
      const addonIds: number[] = [];
      addonIdsSet.forEach((id) => addonIds.push(id));
      const addons = await prisma.addon.findMany({
        where: { id: { in: addonIds } },
        select: { id: true, price: true },
      });

      menuAddonPairs.forEach((pair) => {
        const key = `${pair.menuId}-${pair.addonId}`;
        const addon = addons.find((a) => a.id === pair.addonId);
        priceMap.set(key, addon?.price || 0);
      });
    } catch {
      // Return empty map on error
    }

    return priceMap;
  }
}

export async function fetchAddonWithAddonCat(id: number) {
  noStore();
  if (!id) return;
  try {
    const addons = await prisma.addon.findMany({
      where: { addonCategoryId: id },
    });
    return addons;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addon data.");
  }
}

export async function fetchMenuCategoryMenu() {
  noStore();
  try {
    const menuCategories = await fetchMenuCategory();
    const menuCategoryIds =
      menuCategories && menuCategories.map((item) => item.id);
    const menuCategoryMenus = await prisma.menuCategoryMenu.findMany({
      where: { menuCategoryId: { in: menuCategoryIds } },
    });
    return menuCategoryMenus;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch menuCategoryMenu data.");
  }
}

export async function fetchMenu() {
  noStore();
  try {
    const menuCategoryMenus = await fetchMenuCategoryMenu();
    const menuCategoryMenuIds = menuCategoryMenus.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuCategoryMenuIds }, isArchived: false },
      orderBy: { id: "asc" },
    });
    return menus;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

export async function fetchMenuWithId(id: number) {
  noStore();
  try {
    const menu = await prisma.menu.findFirst({
      where: { id },
      orderBy: { id: "asc" },
    });
    return menu;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

export async function fetchMenuWithIds(ids: number[]) {
  noStore();
  try {
    const menu = await prisma.menu.findMany({
      where: { id: { in: ids } },
      orderBy: { id: "asc" },
    });
    return menu;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

/**
 * Fetch menus that have the addon category linked (menus where this addon can be used)
 */
export async function fetchMenusForAddon(addonId: number) {
  noStore();
  try {
    const addon = await prisma.addon.findUnique({
      where: { id: addonId },
      select: { addonCategoryId: true },
    });

    if (!addon) return [];

    const menuAddonCategories = await prisma.menuAddonCategory.findMany({
      where: { addonCategoryId: addon.addonCategoryId },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        menu: {
          name: "asc",
        },
      },
    });

    return menuAddonCategories.map((mac) => mac.menu);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchMenuCategoryWithId(id: number) {
  noStore();
  try {
    const menuCategory = await prisma.menuCategory.findFirst({
      where: { id },
      orderBy: { id: "asc" },
    });
    return menuCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch MenuCategory data.");
  }
}

export async function fetchAddonCategoryWithId(id: number) {
  noStore();
  try {
    const addonCategory = await prisma.addonCategory.findFirst({
      where: { id },
      orderBy: { id: "asc" },
    });
    return addonCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addonCategory data.");
  }
}

export async function fetchAddonCategoryWithIds(ids: number[]) {
  noStore();
  if (ids.length === 0) return;

  try {
    const addonCategory = await prisma.addonCategory.findMany({
      where: { id: { in: ids } },
    });
    return addonCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch addonCategory data.");
  }
}

export async function fetchMenuCategoryWithMenu(id: number) {
  noStore();
  try {
    const menu = await fetchMenuWithId(id);
    const menuCategoryMenus = await prisma.menuCategoryMenu.findMany({
      where: { menuId: menu?.id },
    });
    return menuCategoryMenus;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch MenuCategoryMenu data.");
  }
}

export async function fetchLocation() {
  noStore();
  try {
    const { company } = await fetchCompany();
    const location = await prisma.location.findMany({
      where: { companyId: company?.id, isArchived: false },
      orderBy: { id: "asc" },
    });
    return location;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch location data.");
  }
}

export async function fetchLocationWithId(id: number) {
  noStore();
  try {
    const location = await prisma.location.findFirst({ where: { id } });
    return location;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch location data.");
  }
}

export async function fetchTable() {
  noStore();
  try {
    const selectedLocation = await fetchSelectedLocation();
    const table = await prisma.table.findMany({
      where: {
        locationId: selectedLocation?.locationId,
        isArchived: false,
      },
      orderBy: { id: "asc" },
    });
    return table;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch table data.");
  }
}
export async function fetchTableWithId(id: number) {
  noStore();
  if (!id) return;
  try {
    const table = await prisma.table.findFirst({ where: { id } });
    return table;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch table data.");
  }
}

export async function checkTableLocation(id: number) {
  noStore();
  try {
    const selectedLocation = await fetchSelectedLocation();
    const table = await prisma.table.findFirst({
      where: { id, locationId: selectedLocation?.locationId },
    });
    return table;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch table data.");
  }
}

export async function fetchTableWithIds(ids: number[]) {
  noStore();
  try {
    const table = await prisma.table.findMany({ where: { id: { in: ids } } });
    return table;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch table data.");
  }
}

export async function fetchSelectedLocation() {
  noStore();
  try {
    const user = await fetchUser();
    return await prisma.selectedLocation.findFirst({
      where: { userId: user?.id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch selected location data.");
  }
}

export async function fetchSelectedLocationData() {
  noStore();
  try {
    const user = await fetchUser();
    const location = await prisma.selectedLocation.findFirst({
      where: { userId: user?.id },
    });
    if (!user || !location) return;
    return await prisma.location.findUnique({ where: { id: location.id } });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch selected location data.");
  }
}

export async function fetchDisableLocationMenu() {
  noStore();
  try {
    const selectedLocation = await fetchSelectedLocation();
    const disabledLocationMenu = await prisma.disabledLocationMenu.findMany({
      where: { locationId: selectedLocation?.locationId },
    });
    return disabledLocationMenu;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch disable location menu data.");
  }
}

export async function fetchDisableLocationMenuCat() {
  noStore();
  try {
    const selectedLocation = await fetchSelectedLocation();
    const disabledLocationMenuCat =
      await prisma.disabledLocationMenuCategory.findMany({
        where: { locationId: selectedLocation?.locationId },
      });
    return disabledLocationMenuCat;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch disable location menu data.");
  }
}

export async function fetchOrder() {
  noStore();
  try {
    const table = await fetchTable();
    const tableId = table.map((item) => item.id);
    const order = await prisma.order.findMany({
      where: {
        tableId: { in: tableId },
        status: { notIn: [OrderStatus.PAID] },
        isArchived: false,
      },
      orderBy: { id: "desc" },
    });
    return order;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch order data.");
  }
}

export async function fetchOrderWithTableId(tableId: number) {
  noStore();
  try {
    const table = fetchTableWithId(tableId);
    if (!table) return undefined;
    return await prisma.order.findMany({
      where: {
        tableId,
        isArchived: false,
        status: { not: OrderStatus.PAID },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error(
      `Database Error for Table ID ${tableId} and Status ${status}:`,
      error
    );
    throw new Error("Failed to fetch order data.");
  }
}

export async function fetchNotification() {
  noStore();
  try {
    const table = await fetchTable();
    const tableIds = table.map((item) => item.id);

    // Fetch both order notifications (with tableId) and WMS notifications (without tableId)
    const notification = await prisma.notification.findMany({
      where: {
        OR: [
          { tableId: { in: tableIds } },
          { type: "WMS_CHECK" }, // Include all WMS check notifications
        ],
      },
      include: {
        wmsCheckResult: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return notification;
  } catch (error) {
    console.error("Database error for notification", error);
    throw new Error("Failed to fetch order data.");
  }
}

export async function getOrderWithDate(startDate: Date, endDate: Date) {
  noStore();
  try {
    const table = await fetchTable();
    const tableId = table.map((item) => item.id);
    if (startDate.getTime() === endDate.getTime()) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
      const order = await prisma.order.findMany({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          tableId: { in: tableId },
        },
      });

      return order;
    } else {
      const endOfDate = new Date(endDate);
      endOfDate.setHours(23, 59, 59, 999);
      const order = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endOfDate },
          tableId: { in: tableId },
        },
      });

      return order;
    }
  } catch (error) {
    console.error("Database error for notification", error);
    throw new Error("Failed to fetch order data.");
  }
}

export const fetchPromotion = async () => {
  noStore();
  try {
    const location = await fetchSelectedLocation();
    return await prisma.promotion.findMany({
      where: { locationId: location?.id, isArchived: false },
      orderBy: { priority: "desc" },
    });
  } catch (error) {
    console.error("Database error for promotion", error);
    throw new Error("Failed to fetch promotion data.");
  }
};

export const fetchFocCatAndFocMenuWithPromotionIds = async (
  promotionIds: number[]
) => {
  noStore();
  try {
    const focCategory = await prisma.focCategory.findMany({
      where: { promotionId: { in: promotionIds } },
    });
    const focMenu = await prisma.focMenu.findMany({
      where: { focCategoryId: { in: focCategory.map((item) => item.id) } },
    });
    return { focCategory, focMenu };
  } catch (error) {
    console.error("Database error for focCategory", error);
    throw new Error("Failed to fetch focCategory data.");
  }
};

export const fetchPromotionMenu = async () => {
  noStore();
  try {
    const menuId = (await fetchMenu()).map((item) => item.id);
    return await prisma.promotionMenu.findMany({
      where: { menuId: { in: menuId } },
    });
  } catch (error) {
    console.error("Database error for promotion", error);
    throw new Error("Failed to fetch promotion data.");
  }
};

export const fetchFocCategoryAndFocMenu = async (id: number) => {
  noStore();
  try {
    const focCategory = await prisma.focCategory.findMany({
      where: { promotionId: id },
    });
    const focCategoryId = focCategory.map((item) => item.id);
    const focMenu = await prisma.focMenu.findMany({
      where: { focCategoryId: { in: focCategoryId } },
    });
    return { focCategory, focMenu };
  } catch (error) {
    console.error("Database error for focCategory and focMenu", error);
    throw new Error("Failed to fetch focCategory and focMenu data.");
  }
};

export const fetchFocMenuAddonCategoryWithPromotionId = async (
  promotionId: number
) => {
  try {
    return await prisma.focMenuAddonCategory.findMany({
      where: { promotionId },
    });
  } catch (error) {
    console.error(
      "Database error for FocMenuAddonCategoryWithPromotionId.",
      error
    );
    throw new Error("Failed to fetch  FocMenuAddonCategoryWithPromotionId.");
  }
};

export const fetchFocMenuAddonCategoryWithPromotionIdAndMenuIds = async ({
  promotionId,
  menuIds,
}: {
  promotionId: number;
  menuIds: number[];
}) => {
  try {
    return await prisma.focMenuAddonCategory.findMany({
      where: { promotionId, menuId: { in: menuIds } },
    });
  } catch (error) {
    console.error(
      "Database error for FocMenuAddonCategoryWithPromotionIdAndMenuIds.",
      error
    );
    throw new Error(
      "Failed to fetch FocMenuAddonCategoryWithPromotionIdAndMenuIds."
    );
  }
};

export const fetchPromotionWithId = async (id: number) => {
  noStore();
  try {
    return await prisma.promotion.findFirst({ where: { id } });
  } catch (error) {
    console.error("Database error for promotion", error);
    throw new Error("Failed to fetch promotion with id.");
  }
};

export const fetchPromotionMenuWithPromoId = async (id: number) => {
  noStore();
  if (!id) return;
  try {
    return await prisma.promotionMenu.findMany({ where: { promotionId: id } });
  } catch (error) {
    console.error("Database error for promotionMenu", error);
    throw new Error("Failed to fetch promotionMenu with id.");
  }
};

export async function fetchMenuAddonCategoryWithMenuIds(menuIds: number[]) {
  noStore();
  try {
    return await prisma.menuAddonCategory.findMany({
      where: { menuId: { in: menuIds } },
    });
  } catch (error) {
    console.error("Database error for menuAddonCateogry", error);
    throw new Error("Failed to fetch menuAddonCateogry with menuId.");
  }
}

export async function fetchMenuAddonCategoryWithMenuId(menuId: number) {
  noStore();
  try {
    return await prisma.menuAddonCategory.findFirst({
      where: { menuId },
    });
  } catch (error) {
    console.error("Database error for menuAddonCateogry", error);
    throw new Error("Failed to fetch menuAddonCateogry with menuId.");
  }
}

export async function fetchAddonWithAddonCatIds(addonCatIds: number[]) {
  noStore();
  try {
    return await prisma.addon.findMany({
      where: { addonCategoryId: { in: addonCatIds } },
    });
  } catch (error) {
    console.error("Database error for addon", error);
    throw new Error("Failed to fetch addon with addonCatIds.");
  }
}

export const getSalesData = async (year: number) => {
  noStore();
  const table = await fetchTable();
  const tableId = table.map((item) => item.id);
  const startDate = new Date(year, 0, 1); // January 1st of the given year
  const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the given year
  const sales = await prisma.receipt.findMany({
    where: {
      tableId: { in: tableId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return sales;
};

export async function fetchRecentReceipt() {
  noStore();
  try {
    const tableIds = (await fetchTable()).map((item) => item.id);
    return await prisma.receipt.findMany({
      where: { tableId: { in: tableIds } },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch recent receipt data.");
  }
}

export async function getReceiptsWithDate(startDate: Date, endDate: Date) {
  noStore();
  try {
    const table = await fetchTable();
    const tableId = table.map((item) => item.id);
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const receipts = await prisma.receipt.findMany({
      where: {
        tableId: { in: tableId },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    return receipts;
  } catch (error) {
    console.error("Database error for receipts", error);
    throw new Error("Failed to fetch receipt data.");
  }
}

/**
 * Get average ingredient costs from purchase orders
 * Returns a map of itemId -> average unitPrice
 */
export async function getIngredientCosts() {
  noStore();
  try {
    const { company } = await fetchCompany();
    if (!company) return new Map<number, number>();

    // Get all purchase order items for received orders
    const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          status: POStatus.RECEIVED,
          warehouse: {
            location: {
              companyId: company.id,
            },
          },
        },
      },
      include: {
        purchaseOrder: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        purchaseOrder: {
          createdAt: "desc",
        },
      },
    });

    // Calculate average cost per item
    const costMap = new Map<number, number[]>();
    purchaseOrderItems.forEach((item) => {
      const existing = costMap.get(item.itemId) || [];
      existing.push(item.unitPrice);
      costMap.set(item.itemId, existing);
    });

    // Calculate average for each item
    const averageCostMap = new Map<number, number>();
    costMap.forEach((prices, itemId) => {
      if (prices.length > 0) {
        const sum = prices.reduce((sum, price) => {
          const numPrice = Number(price);
          return sum + (isNaN(numPrice) ? 0 : numPrice);
        }, 0);
        const average = sum / prices.length;
        if (!isNaN(average) && isFinite(average)) {
          averageCostMap.set(itemId, average);
        }
      }
    });

    return averageCostMap;
  } catch (error) {
    console.error("Database error for ingredient costs", error);
    return new Map<number, number>();
  }
}

/**
 * Calculate food cost for orders within date range
 */
export async function calculateFoodCost(
  startDate: Date,
  endDate: Date
): Promise<number> {
  noStore();
  try {
    const table = await fetchTable();
    const tableId = table.map((item) => item.id);
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get paid orders in date range
    const paidOrders = await prisma.order.findMany({
      where: {
        tableId: { in: tableId },
        status: OrderStatus.PAID,
        isFoc: false,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        menu: true,
      },
    });

    if (paidOrders.length === 0) return 0;

    // Get unique menu IDs and addon IDs
    const menuIdsSet = new Set<number>();
    const addonIdsSet = new Set<number>();
    paidOrders.forEach((order) => {
      menuIdsSet.add(order.menuId);
      if (order.addonId !== null) {
        addonIdsSet.add(order.addonId);
      }
    });
    const menuIds: number[] = [];
    menuIdsSet.forEach((id) => menuIds.push(id));
    const addonIds: number[] = [];
    addonIdsSet.forEach((id) => addonIds.push(id));

    // Get ingredient costs
    const ingredientCosts = await getIngredientCosts();

    // Get menu ingredients and addon ingredients
    const [menuIngredients, addonIngredients] = await Promise.all([
      prisma.menuItemIngredient.findMany({
        where: { menuId: { in: menuIds } },
      }),
      addonIds.length > 0
        ? prisma.addonIngredient.findMany({
            where: { addonId: { in: addonIds } },
          })
        : [],
    ]);

    let totalFoodCost = 0;

    // Calculate food cost for menu items
    paidOrders.forEach((order) => {
      const menuIngs = menuIngredients.filter(
        (ing) => ing.menuId === order.menuId
      );
      menuIngs.forEach((ingredient) => {
        const costPerUnit = ingredientCosts.get(ingredient.itemId) || 0;
        const quantityUsed = ingredient.quantity * order.quantity;
        totalFoodCost += costPerUnit * quantityUsed;
      });

      // Calculate food cost for addons
      if (order.addonId) {
        const addonIngs = addonIngredients.filter(
          (ing) => ing.addonId === order.addonId
        );
        addonIngs.forEach((ingredient) => {
          const costPerUnit = ingredientCosts.get(ingredient.itemId) || 0;
          const quantityUsed = ingredient.extraQty * order.quantity;
          totalFoodCost += costPerUnit * quantityUsed;
        });
      }
    });

    return totalFoodCost;
  } catch (error) {
    console.error("Database error calculating food cost", error);
    return 0;
  }
}

/**
 * Calculate inventory variance (theoretical vs actual stock value)
 */
export async function calculateInventoryVariance(): Promise<number> {
  noStore();
  try {
    const { company } = await fetchCompany();
    if (!company) return 0;

    // Get ingredient costs
    const ingredientCosts = await getIngredientCosts();

    // Get all warehouses for the company
    const warehouses = await prisma.warehouse.findMany({
      where: {
        location: {
          companyId: company.id,
        },
        isArchived: false,
      },
    });

    if (warehouses.length === 0) return 0;

    const warehouseIds = warehouses.map((w) => w.id);

    // Get actual stock
    const actualStocks = await prisma.warehouseStock.findMany({
      where: {
        warehouseId: { in: warehouseIds },
      },
    });

    // Calculate theoretical stock from stock movements
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        warehouseId: { in: warehouseIds },
      },
    });

    // Calculate theoretical quantity per item per warehouse
    const theoreticalStock = new Map<string, number>(); // key: "itemId-warehouseId"

    // Process stock movements to calculate theoretical stock
    stockMovements.forEach((movement) => {
      const key = `${movement.itemId}-${movement.warehouseId}`;
      const current = theoreticalStock.get(key) || 0;
      const quantity = Number(movement.quantity) || 0;

      if (isNaN(quantity) || !isFinite(quantity)) {
        return; // Skip invalid quantities
      }

      if (movement.type === MovementType.IN) {
        theoreticalStock.set(key, current + quantity);
      } else if (movement.type === MovementType.OUT) {
        theoreticalStock.set(key, Math.max(0, current - quantity)); // Prevent negative stock
      }
    });

    // Calculate variance value
    let totalVariance = 0;

    // Check all actual stocks against theoretical
    actualStocks.forEach((stock) => {
      const key = `${stock.itemId}-${stock.warehouseId}`;
      const theoreticalQty = Number(theoreticalStock.get(key)) || 0;
      const actualQty = Number(stock.quantity) || 0;

      // Skip if quantities are invalid
      if (
        isNaN(actualQty) ||
        !isFinite(actualQty) ||
        isNaN(theoreticalQty) ||
        !isFinite(theoreticalQty)
      ) {
        return;
      }

      const variance = actualQty - theoreticalQty;
      const costPerUnit = Number(ingredientCosts.get(stock.itemId)) || 0;

      // Only add to variance if we have a valid cost for the item
      if (!isNaN(costPerUnit) && isFinite(costPerUnit) && costPerUnit > 0) {
        const varianceValue = variance * costPerUnit;
        if (!isNaN(varianceValue) && isFinite(varianceValue)) {
          totalVariance += varianceValue;
        }
      }
    });

    // Also check theoretical stocks that don't have actual stock records
    theoreticalStock.forEach((theoreticalQty, key) => {
      const [itemIdStr, warehouseIdStr] = key.split("-");
      const itemId = parseInt(itemIdStr, 10);
      const warehouseId = parseInt(warehouseIdStr, 10);

      // Skip if parsing failed
      if (isNaN(itemId) || isNaN(warehouseId)) {
        return;
      }

      const qty = Number(theoreticalQty) || 0;

      // Skip if quantity is invalid
      if (isNaN(qty) || !isFinite(qty)) {
        return;
      }

      // Check if this item-warehouse combination exists in actual stock
      const actualStock = actualStocks.find(
        (s) => s.itemId === itemId && s.warehouseId === warehouseId
      );

      // If no actual stock record exists, the variance is negative theoretical value
      if (!actualStock && qty > 0) {
        const costPerUnit = Number(ingredientCosts.get(itemId)) || 0;
        if (!isNaN(costPerUnit) && isFinite(costPerUnit) && costPerUnit > 0) {
          const varianceValue = -qty * costPerUnit;
          if (!isNaN(varianceValue) && isFinite(varianceValue)) {
            totalVariance += varianceValue;
          }
        }
      }
    });

    // Ensure we return a valid number
    return isNaN(totalVariance) || !isFinite(totalVariance) ? 0 : totalVariance;
  } catch (error) {
    console.error("Database error calculating inventory variance", error);
    return 0;
  }
}
