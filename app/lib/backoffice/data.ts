"use server";
import { prisma } from "@/db";
import {
  MovementSource,
  MovementType,
  OrderStatus,
  POStatus,
  Unit,
  UnitCategory,
} from "@prisma/client";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

interface Props {
  email: string;
  name: string;
}

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
    const notification = await prisma.notification.findMany({
      where: { tableId: { in: table.map((item) => item.id) } },
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

export async function createDefaultData({ email, name }: Props) {
  try {
    const user = await fetchUser();
    if (user?.email === email) return;
    const newCompany = await prisma.company.create({
      data: {
        name: "Default Company",
        street: "Default Street",
        township: "Default township",
        city: "Default City",
      },
    });
    const newUser = await prisma.user.create({
      data: { email, name, companyId: newCompany.id },
    });
    const newLocation = await prisma.location.create({
      data: {
        name: "Default location",
        street: "Default street",
        township: "Default township",
        city: "Default city",
        companyId: newCompany.id,
      },
    });
    await prisma.selectedLocation.create({
      data: { userId: newUser.id, locationId: newLocation.id },
    });
    await prisma.table.create({
      data: {
        name: "Default table",
        locationId: newLocation.id,
      },
    });
    const newMenuCategory = await prisma.menuCategory.create({
      data: { name: "Default menu Category", companyId: newCompany.id },
    });
    const newMenu = await prisma.menu.create({
      data: { name: "Default menu", price: 1000 },
    });
    await prisma.menuCategoryMenu.create({
      data: { menuId: newMenu.id, menuCategoryId: newMenuCategory.id },
    });
    const newAddonCategory = await prisma.addonCategory.create({
      data: { name: "Default addon category" },
    });
    await prisma.menuAddonCategory.create({
      data: { menuId: newMenu.id, addonCategoryId: newAddonCategory.id },
    });

    const newAddonData = [
      { name: "Addon1", addonCategoryId: newAddonCategory.id },
      { name: "Addon2", addonCategoryId: newAddonCategory.id },
      { name: "Addon3", addonCategoryId: newAddonCategory.id },
    ];
    const addons = await prisma.$transaction(
      newAddonData.map((addon) => prisma.addon.create({ data: addon }))
    );

    // WMS Default data

    const warehouse = await prisma.warehouse.create({
      data: { name: "Default warehouse", locationId: newLocation.id },
    });

    await prisma.selectedWarehouse.create({
      data: { userId: newUser.id, warehouseId: warehouse.id },
    });

    const newSuppliers = [
      {
        name: "Shwe Rice Co.",
        phone: "091234556789",
        email: "example@gmail.com",
        address: "...",
        companyId: newCompany.id,
      },
      {
        name: "City Mart",
        phone: "091234556789",
        email: "example@gmail.com",
        address: "...",
        companyId: newCompany.id,
      },
      {
        name: "Aye Aye Eggs",
        phone: "091234556789",
        email: "example@gmail.com",
        address: "...",
        companyId: newCompany.id,
      },
    ];

    const suppliers = await prisma.$transaction(
      newSuppliers.map((item) => prisma.supplier.create({ data: item }))
    );

    const newWarehouseItems = [
      {
        name: "ကြက်ဥ",
        unit: Unit.UNIT,
        unitCategory: UnitCategory.COUNT,
        threshold: 20,
        companyId: newCompany.id,
      },
      {
        name: "ဆီ",
        unit: Unit.L,
        unitCategory: UnitCategory.VOLUME,
        threshold: 5,
        companyId: newCompany.id,
      },
      {
        name: "ကြက်သား",
        unit: Unit.VISS,
        unitCategory: UnitCategory.MASS,
        threshold: 2,
        companyId: newCompany.id,
      },
    ];
    const warehouseItems = await prisma.$transaction(
      newWarehouseItems.map((item) =>
        prisma.warehouseItem.create({ data: item })
      )
    );
    const menuItemIngredients = [
      { menuId: newMenu.id, itemId: warehouseItems[0].id, quantity: 1 },
      { menuId: newMenu.id, itemId: warehouseItems[1].id, quantity: 250 },
      { menuId: newMenu.id, itemId: warehouseItems[2].id, quantity: 300 },
    ];

    await prisma.$transaction(
      menuItemIngredients.map((item) =>
        prisma.menuItemIngredient.create({ data: item })
      )
    );

    const newAddonIngredients = [
      {
        addonId: addons[0].id,
        menuId: newMenu.id,
        itemId: warehouseItems[0].id,
        extraQty: 1,
      },
      {
        addonId: addons[0].id,
        menuId: newMenu.id,
        itemId: warehouseItems[1].id,
        extraQty: 200,
      },
      {
        addonId: addons[2].id,
        menuId: newMenu.id,
        itemId: warehouseItems[0].id,
        extraQty: 3,
      },
    ];

    await prisma.$transaction(
      newAddonIngredients.map((item) =>
        prisma.addonIngredient.create({ data: item })
      )
    );

    const newPurchaseOrders = suppliers.map((item) => {
      return {
        code: nanoid(6),
        supplierId: item.id,
        status: POStatus.RECEIVED,
        warehouseId: warehouse.id,
      };
    });

    const purchaseOrders = await prisma.$transaction(
      newPurchaseOrders.map((item) =>
        prisma.purchaseOrder.create({ data: item })
      )
    );

    const newPurchaseOrderItems = purchaseOrders.map((item, index) => {
      return {
        purchaseOrderId: item.id,
        itemId: warehouseItems[index].id,
        quantity: 20,
        unitPrice: 500,
      };
    });

    await prisma.$transaction(
      newPurchaseOrderItems.map((item) =>
        prisma.purchaseOrderItem.create({ data: item })
      )
    );

    const newStockMovements = warehouseItems.map((item, index) => {
      return {
        itemId: item.id,
        type: MovementType.IN,
        quantity: 20,
        reference: `PO-${purchaseOrders[index].id}`,
        note: `Product from ${purchaseOrders[index].supplierId}`,
        warehouseId: warehouse.id,
        source: MovementSource.PURCHASE_ORDER,
      };
    });
    await prisma.$transaction(
      newStockMovements.map((item) =>
        prisma.stockMovement.create({ data: item })
      )
    );
    const newWarehouseStock = warehouseItems.map((item) => {
      return {
        itemId: item.id,
        quantity: 20,
        warehouseId: warehouse.id,
      };
    });

    await prisma.$transaction(
      newWarehouseStock.map((item) =>
        prisma.warehouseStock.create({ data: item })
      )
    );
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create user data.");
  }
}
