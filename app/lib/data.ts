"use server";
import { prisma } from "@/db";
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
      where: { companyId: company?.id },
      orderBy: { id: "asc" },
    });
    return menuCategory;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch menuCategory data.");
  }
}

export async function fetchDisableLocationMenuCategoies() {
  noStore();
  try {
    const menuCategories = await fetchMenuCategory();
    const menuCategoryIds =
      menuCategories && menuCategories.map((item) => item.id);
    const disableLocationMenuCategories =
      await prisma.disabledLocationMenuCategory.findMany({
        where: { menuCategoryId: { in: menuCategoryIds } },
      });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch disableLocationMenuCategory data.");
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

export async function fetchMenus() {
  noStore();
  try {
    const menuCategoryMenus = await fetchMenuCategoryMenu();
    const menuCategoryMenuIds = menuCategoryMenus.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuCategoryMenuIds } },
      orderBy: { id: "asc" },
    });
    return menus;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

export async function fetchMenu(id: number) {
  noStore();
  try {
    const menu = await prisma.menu.findFirst({ where: { id } });
    return menu;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu data.");
  }
}

export async function fetchMenuCategoryMenuWithMenu(id: number) {
  noStore();
  try {
    const menu = await fetchMenu(id);
    const menuCategoryMenus = await prisma.menuCategoryMenu.findMany({
      where: { menuId: menu?.id },
    });
    return menuCategoryMenus;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch MenuCategoryMenu data.");
  }
}

export async function fetchMenuCategoryWithMenu(id: number) {
  noStore();
  try {
    const menuCategoryMenu = await fetchMenuCategoryMenuWithMenu(id);
    return menuCategoryMenu;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch Menu category data.");
  }
}

export async function createDefaultData({ email, name }: Props) {
  try {
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
      },
    });
    let newTable = await prisma.table.create({
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
    throw new Error("Failed to fetch user data.");
  }
}
