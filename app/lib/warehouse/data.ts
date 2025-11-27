"use server";

import { prisma } from "@/db";
import { unstable_noStore as noStore } from "next/cache";
import {
  fetchAddon,
  fetchCompany,
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
    return await prisma.selectedWarehouse.findFirst({
      where: { userId: user?.id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return null;
  }
}

export async function fetchWarehouseItem() {
  noStore();
  try {
    const { company } = await fetchCompany();
    return await prisma.warehouseItem.findMany({
      where: { companyId: company?.id, isArchived: false },
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
    const { company } = await fetchCompany();
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

export async function fetchAddonIngredientWithAddonIds(addonIds: number[]) {
  noStore();
  try {
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
      orderBy: { id: "desc" },
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

export async function fetchWarehouseStock() {
  noStore();
  try {
    const selectedWarehouse = await fetchSelectedWarehouse();
    return await prisma.warehouseStock.findMany({
      where: { warehouseId: selectedWarehouse?.warehouseId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch warehouse stock data.");
  }
}

export async function fetchWarehouseStockWithItemIds(itemIds: number[]) { 
  noStore();
  if(!itemIds.length) return [];
  try {
    return await prisma.warehouseStock.findMany({ where: { itemId: { in: itemIds } } });
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function fetchStockMovement() {
  noStore();
  try {
    const warehouseItem = await fetchWarehouseItem();
    const itemIds = warehouseItem.map((item) => item.id);

    return await prisma.stockMovement.findMany({
      where: { itemId: { in: itemIds } },
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch stock movement data.");
  }
}

export async function fetchAuditLog() {
  noStore();
  try {
    const { company } = await fetchCompany();
    return await prisma.auditLog.findMany({
      where: { companyId: company?.id },
      orderBy: { id: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch audit log data.");
  }
}

export async function fetchMenuAddonCategoryWithCategoryAndMenu({
  categoryId,
  menuId,
}: {
  categoryId: number;
  menuId: number;
}) {
  noStore();
  if (!categoryId || !menuId) return null;
  try {
    return await prisma.menuAddonCategory.findFirst({
      where: { addonCategoryId: categoryId, menuId },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Add-on Cateogry data.");
  }
}

export async function fetchDashboardData() {
  noStore();
  try {
    const selectedWarehouse = await fetchSelectedWarehouse();
    if (!selectedWarehouse) {
      return {
        totalStockItems: 0,
        lowStockItems: 0,
        pendingPOs: 0,
        recentMovements: [],
        recentPOs: [],
        lowStockItemsList: [],
      };
    }

    // Fetch warehouse stock
    const warehouseStock = await prisma.warehouseStock.findMany({
      where: { warehouseId: selectedWarehouse.warehouseId },
      include: { warehouseItem: true },
    });

    // Calculate low stock items
    const lowStockItemsList = warehouseStock.filter(
      (stock) => stock.quantity <= stock.warehouseItem.threshold
    );

    // Fetch recent stock movements (last 10)
    const recentMovements = await prisma.stockMovement.findMany({
      where: { warehouseId: selectedWarehouse.warehouseId },
      include: { warehouseItem: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch recent purchase orders (last 5)
    const recentPOs = await prisma.purchaseOrder.findMany({
      where: { warehouseId: selectedWarehouse.warehouseId },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Count pending purchase orders
    const pendingPOs = await prisma.purchaseOrder.count({
      where: {
        warehouseId: selectedWarehouse.warehouseId,
        status: "PENDING",
      },
    });

    return {
      totalStockItems: warehouseStock.length,
      lowStockItems: lowStockItemsList.length,
      pendingPOs,
      recentMovements,
      recentPOs,
      lowStockItemsList: lowStockItemsList.map((stock) => ({
        id: stock.id,
        name: stock.warehouseItem.name,
        quantity: stock.quantity,
        threshold: stock.warehouseItem.threshold,
        unit: stock.warehouseItem.unit,
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    return {
      totalStockItems: 0,
      lowStockItems: 0,
      pendingPOs: 0,
      recentMovements: [],
      recentPOs: [],
      lowStockItemsList: [],
    };
  }
}

export async function fetchWMSCheckResult(id: number) {
  noStore();
  if (!id) return null;
  try {
    // Note: After running migration, Prisma will generate the client with the correct model name
    return await (prisma as any).wMSCheckResult.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch WMS check result data.");
  }
}