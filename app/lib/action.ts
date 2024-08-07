"use server";

import { config } from "@/config";
import { prisma } from "@/db";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import { fetchCompany, fetchMenuAddonCategory } from "./data";

interface Props {
  formData: FormData;
}

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

export async function createMenu({ formData }: Props) {
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const category = (formData.get("category") as string).split(",");
  const image = formData.get("image");
  const isValid = name && price > 0 && category.length > 0;
  if (!isValid) return { message: "Missing required fields", isSuccess: false };

  try {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = (await uploadImage(formData)) as string;
    }

    const menu = await prisma.menu.create({
      data: { name, price, assetUrl: imageUrl },
    });

    await prisma.$transaction(
      category.map((item) =>
        prisma.menuCategoryMenu.create({
          data: { menuId: menu.id, menuCategoryId: Number(item) },
        })
      )
    );

    revalidatePath("/backoffice/menu");
    return { message: "Created menu successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating menu",
      isSuccess: false,
    };
  }
}

export async function createMenuCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const company = await fetchCompany();
  const isValid = company && name;
  if (!isValid)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };

  try {
    await prisma.menuCategory.create({
      data: { name, companyId: company.id },
    });
    revalidatePath("/backoffice/menu-category");
    return { message: "Created menu category successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating menu category",
      isSuccess: false,
    };
  }
}

export async function updateMenuCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const id = Number(formData.get("id"));
  const isValid = id && name;
  if (!isValid)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    await prisma.menuCategory.update({ where: { id }, data: { name } });
    revalidatePath("/backoffice/menu-category");
    return { message: "Updated menu category successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating menu category",
      isSuccess: false,
    };
  }
}

export async function updateMenu({ formData }: Props) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const category = (formData.get("category") as string).split(",");
  const categoryIds = category.map((item) => Number(item));
  const image = formData.get("image");
  const isValid = name && price > 0 && category.length > 0;
  if (!isValid) return { message: "Missing required fields", isSuccess: false };
  try {
    if (image) {
      const imageUrl = (await uploadImage(formData)) as string;
      const menu = await prisma.menu.update({
        where: { id },
        data: { name, price, assetUrl: imageUrl },
      });
    } else {
      const menu = await prisma.menu.update({
        where: { id },
        data: { name, price },
      });
    }
    const menuCategoryMenu = await prisma.menuCategoryMenu.findMany({
      where: { menuId: id },
    });
    //remove
    const toRemove = menuCategoryMenu.filter(
      (item) => !categoryIds.includes(item.menuCategoryId)
    );
    if (toRemove.length) {
      await prisma.menuCategoryMenu.deleteMany({
        where: {
          menuCategoryId: { in: toRemove.map((item) => item.menuCategoryId) },
          menuId: id,
        },
      });
    }
    //add
    const toAdd = categoryIds.filter(
      (categoryId) =>
        !menuCategoryMenu.find((item) => item.menuCategoryId === categoryId)
    );
    if (toAdd.length) {
      await prisma.$transaction(
        toAdd.map((item: number) =>
          prisma.menuCategoryMenu.create({
            data: { menuId: id, menuCategoryId: item },
          })
        )
      );
    }

    revalidatePath("/backoffice/menu");
    return { message: "Updated menu successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating menu",
      isSuccess: false,
    };
  }
}

export async function deleteMenu(id: number) {
  try {
    await prisma.menu.update({
      where: { id: id },
      data: { isArchived: true },
    });
    revalidatePath("/backoffice/menu");
    return { message: "Deleted menu successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting menu",
      isSuccess: false,
    };
  }
}

export async function deleteAddonCategory(id: number) {
  try {
    await prisma.addonCategory.update({
      where: { id: id },
      data: { isArchived: true },
    });
    revalidatePath("/backoffice/addon-category");
    return { message: "Deleted addon category successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting addon category",
      isSuccess: false,
    };
  }
}

export async function deleteMenuCategory(id: number) {
  try {
    await prisma.menuCategory.update({
      where: { id: id },
      data: { isArchived: true },
    });
    revalidatePath("/backoffice/menu-category");
    return { message: "Deleted menu category successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting menu category",
      isSuccess: false,
    };
  }
}

export async function createAddonCategory(FormData: FormData) {
  const name = FormData.get("name") as string;
  const menuId = (FormData.get("menu") as string).split(",");
  const isRequired = FormData.get("isRequired") === "true";
  const isValid = name && menuId && isRequired != undefined;
  if (!isValid)
    return {
      message: "Missing Requried fields",
      isSuccess: false,
    };
  try {
    const addonCategory = await prisma.addonCategory.create({
      data: { name, isRequired },
    });
    await prisma.$transaction(
      menuId.map((item) =>
        prisma.menuAddonCategory.create({
          data: { addonCategoryId: addonCategory.id, menuId: Number(item) },
        })
      )
    );
    revalidatePath("/backoffice/addon-category");
    return { message: "Created addon category successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting addon category",
      isSuccess: false,
    };
  }
}

export async function updateAddonCategory(FormData: FormData) {
  const id = Number(FormData.get("id"));
  const name = FormData.get("name") as string;
  const isRequired = FormData.get("isRequired") === "true";
  const menuId = String(FormData.get("menu"))
    .split(",")
    .map((item) => Number(item));
  const isValid = id && name && menuId.length > 0 && isRequired != undefined;
  if (!isValid)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    const addonCategory = await prisma.addonCategory.update({
      where: { id },
      data: { name, isRequired },
    });
    const menuAddonCategory = await fetchMenuAddonCategory();
    const validMenuAddonCat = menuAddonCategory.filter(
      (item) => item.addonCategoryId === id
    );
    //toRemove
    const toRemove = validMenuAddonCat.filter(
      (item) => !menuId.includes(item.menuId)
    );
    if (toRemove.length) {
      await prisma.menuAddonCategory.deleteMany({
        where: {
          menuId: { in: toRemove.map((item) => item.menuId) },
          addonCategoryId: id,
        },
      });
    }
    //toAdd
    const toAdd = menuId.filter(
      (menuId) => !validMenuAddonCat.find((item) => item.menuId === menuId)
    );
    if (toAdd.length) {
      await prisma.$transaction(
        toAdd.map((item) =>
          prisma.menuAddonCategory.create({
            data: { menuId: item, addonCategoryId: id },
          })
        )
      );
    }
    revalidatePath("/backoffice/addon-category");
    return {
      message: "Updated addon category successfully",
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating menu",
      isSuccess: false,
    };
  }
}

export async function deleteImage(id: number) {
  try {
    const menu = await prisma.menu.update({
      where: { id },
      data: { assetUrl: "" },
    });
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while delete image",
      isSuccess: false,
    };
  }
}

export async function uploadImage(formData: FormData) {
  const imageFile = formData.get("image") as File;
  if (!imageFile) {
    throw new Error("No image file provided");
  }
  const arrayBuffer = await imageFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "restaurant-pos" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Failed to get secure URL from Cloudinary"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}
