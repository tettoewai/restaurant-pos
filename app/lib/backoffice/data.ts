"use server";
import { prisma } from "@/db";
import { ORDERSTATUS } from "@prisma/client";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";

interface Props {
  email: string;
  name: string;
}

export async function fetchUser() {
  try {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email) return;
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch user data.");
  }
}

export async function fetchCompany() {
  try {
    const user = await fetchUser();
    const comapny = await prisma.company.findFirst({
      where: { id: user?.companyId },
    });
    return comapny;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch company data.");
  }
}
export async function fetchMenuCategory() {
  noStore();
  try {
    const company = await fetchCompany();
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
  // await new Promise((resolve) => setTimeout(resolve, 5000));
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
    const company = await fetchCompany();
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
        locationId: selectedLocation?.id,
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
      where: { id, locationId: selectedLocation?.id },
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
  try {
    const companyId = (await fetchCompany())?.id;
    const selectedLocation = await prisma.location.findFirst({
      where: { isSelected: true, companyId },
    });
    return selectedLocation;
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
      where: { locationId: selectedLocation?.id },
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
        where: { locationId: selectedLocation?.id },
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
        status: { notIn: [ORDERSTATUS.PAID] },
        isArchived: false,
      },
    });
    return order;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch order data.");
  }
}

export async function fetchOrderWithTableId({ tableId }: { tableId: number }) {
  noStore();
  try {
    const table = fetchTableWithId(tableId);
    if (!table) return undefined;
    return await prisma.order.findMany({
      where: {
        tableId,
        isArchived: false,
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

export async function getOrderCountWithDate(startDate: Date, endDate: Date) {
  const table = await fetchTable();
  const tableId = table.map((item) => item.id);
  if (startDate.getTime() === endDate.getTime()) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orderCount = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        tableId: { in: tableId },
        isArchived: false,
      },
    });

    return orderCount;
  } else {
    const endOfDate = new Date(endDate);
    endOfDate.setHours(23, 59, 59, 999);
    const orderCount = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endOfDate },
        tableId: { in: tableId },
        isArchived: false,
      },
    });

    return orderCount;
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
    await prisma.user.create({
      data: { email, name, companyId: newCompany.id },
    });
    const newLocation = await prisma.location.create({
      data: {
        name: "Default location",
        street: "Default street",
        township: "Default township",
        city: "Default city",
        companyId: newCompany.id,
        isSelected: true,
      },
    });
    const newTable = await prisma.table.create({
      data: {
        name: "Default table",
        locationId: newLocation.id,
        assetUrl: "",
      },
    });
    const newMenuCategory = await prisma.menuCategory.create({
      data: { name: "Default menu Category", companyId: newCompany.id },
    });
    const newMenu = await prisma.menu.create({
      data: { name: "Default menu", price: 1000 },
    });
    const newMenuCategoryMenu = await prisma.menuCategoryMenu.create({
      data: { menuId: newMenu.id, menuCategoryId: newMenuCategory.id },
    });
    const newAddonCategory = await prisma.addonCategory.create({
      data: { name: "Default addon category" },
    });
    const newMenuAddonCategory = await prisma.menuAddonCategory.create({
      data: { menuId: newMenu.id, addonCategoryId: newAddonCategory.id },
    });

    const newAddonData = [
      { name: "Addon1", addonCategoryId: newAddonCategory.id },
      { name: "Addon2", addonCategoryId: newAddonCategory.id },
      { name: "Addon3", addonCategoryId: newAddonCategory.id },
    ];
    const newAddon = await prisma.$transaction(
      newAddonData.map((addon) => prisma.addon.create({ data: addon }))
    );
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create user data.");
  }
}

export const getSalesData = async (year: number) => {
  const startDate = new Date(year, 0, 1); // January 1st of the given year
  const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st of the given year
  const sales = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isArchived: false,
    },
  });

  return sales;
};
