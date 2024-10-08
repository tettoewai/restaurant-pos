"use server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/db";
import { fetchLocationWithId, fetchTableWithId } from "../backoffice/data";
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
