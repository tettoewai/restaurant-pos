"use server";

import { prisma } from "@/db";
import { unstable_noStore as noStore } from "next/cache";
import {
  fetchAddon,
  fetchCompany,
  fetchMenu,
  fetchSelectedLocation,
  fetchUser,
} from "../backoffice/data";

export async function fetchWarehouse() {
  noStore();
  try {
    const selectedLocation = await fetchSelectedLocation();
    if (selectedLocation) {
      return await prisma.warehouse.findMany({
        where: { locationId: selectedLocation.locationId, isArchived: false },
        orderBy: { id: "desc" },
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchWarehouseWithId(id: number) {
  noStore();
  if (!id) return null;
  try {
    return await prisma.warehouse.findFirst({ where: { id } });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch warehouse data.");
  }
}

export async function fetchSelectedWarehouse() {
  noStore();
  try {
    const user = await fetchUser();
    if (!user) return null;
    return await prisma.selectedWarehouse.findFirst({
      where: { userId: user.id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function fetchWarehouseItem() {
  noStore();
  try {
    const company = await fetchCompany();
    if (!company) return null;
    return await prisma.warehouseItem.findMany({
      where: { companyId: company.id, isArchived: false },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchMenuItemIngredientWithMenuIds(menuIds: number[]) {
  noStore();
  try {
    return await prisma.menuItemIngredient.findMany({
      where: { menuId: { in: menuIds } },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchWarehouseItemWithIds(ids: number[]) {
  noStore();
  try {
    return await prisma.warehouseItem.findMany({ where: { id: { in: ids } } });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchSupplier() {
  noStore();
  try {
    const company = await fetchCompany();
    if (!company) return [];
    return await prisma.supplier.findMany({
      where: { companyId: company.id, isArchived: false },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchSupplierWithId(id: number) {
  noStore();
  if (!id) return null;
  try {
    return await prisma.supplier.findFirst({ where: { id } });
  } catch (error) {
    console.error("Database Error:", error);
  }
}

export async function fetchSupplierWithIds(ids: number[]) {
  noStore();
  try {
    return await prisma.supplier.findMany({ where: { id: { in: ids } } });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchAddonIngredients() {
  noStore();
  try {
    const addons = await fetchAddon();
    const addonIds = addons.map((item) => item.id);
    return await prisma.addonIngredient.findMany({
      where: { addonId: { in: addonIds } },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchPurchaseOrder() {
  noStore();
  try {
    const warehouse = await fetchWarehouse();
    const warehouseId = warehouse.map((item) => item.id);
    return await prisma.purchaseOrder.findMany({
      where: { warehouseId: { in: warehouseId } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchPOItemWithPOIds(poIds: number[]) {
  noStore();
  try {
    return await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: { in: poIds } },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchWarehousesWithIds(ids: number[]) {
  noStore();
  try {
    return await prisma.warehouse.findMany({ where: { id: { in: ids } } });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchPurchaseOrderWithId(id: number) {
  noStore();
  try {
    return await prisma.purchaseOrder.findFirst({ where: { id } });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch po data.");
  }
}

export async function fetchPOItemWithPOId(poId: number) {
  noStore();
  try {
    return await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}
