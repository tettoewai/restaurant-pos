"use server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/db";
import {
  fetchAddonCategoryWithIds,
  fetchCompany,
  fetchLocationWithId,
  fetchTableWithId,
} from "../backoffice/data";
import { ORDERSTATUS } from "@prisma/client";

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

    const menuIds = menuCategoryMenus.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds }, isArchived: false },
      orderBy: { id: "asc" },
    });

    return menus.filter((item) => !disabledMenuIds.includes(item.id));
  } catch (error) {
    console.error("Error in fetchMenuOrder:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

export async function fetchOrder(tableId: number) {
  noStore();
  try {
    const order = await prisma.order.findMany({
      where: {
        tableId,
        status: { notIn: [ORDERSTATUS.PAID] },
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
  if (!itemId) return null;
  try {
    const order = await prisma.order.findMany({ where: { itemId } });
    return order;
  } catch (error) {
    console.error("Error in fetchOrder:", error);
    throw new Error("Failed to fetch Order data.");
  }
}

export async function fetchReceiptWithCode(receitpCode: string) {
  if (!receitpCode) return;
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
  if (!tableId) {
    console.error("Missing tableId.");
    throw new Error("Missing tableId.");
  }
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

export async function fetchAddonCategoryWithMenuId(menuId: number) {
  noStore();
  try {
    const menuAddonCategory = await prisma.menuAddonCategory.findMany({
      where: { menuId },
    });
    const addonCategoryIds = menuAddonCategory.map(
      (item) => item.addonCategoryId
    );
    return await fetchAddonCategoryWithIds(addonCategoryIds);
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
        status: { notIn: [ORDERSTATUS.PAID, ORDERSTATUS.CANCELED] },
      },
    });
  } catch (error) {
    console.error("Error in fetchOrderWithTableIds:", error);
    throw new Error("Failed to fetch order with tableIds data.");
  }
}
