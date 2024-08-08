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
