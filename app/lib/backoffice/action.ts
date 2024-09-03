"use server";

import { config } from "@/config";
import { prisma } from "@/db";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import {
  fetchCompany,
  fetchLocation,
  fetchMenuAddonCategory,
  fetchSelectedLocation,
} from "./data";
import QRCode from "qrcode";

interface Props {
  formData: FormData;
}

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

export async function updateCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const street = formData.get("street") as string;
  const township = formData.get("township") as string;
  const city = formData.get("city") as string;
  const isValid = name && street && township && city;
  if (!isValid)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    const company = await fetchCompany();
    await prisma.company.update({
      where: { id: company?.id },
      data: { name, street, township, city },
    });
    revalidatePath("/backoffice");
    return { message: "Updated company successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating company",
      isSuccess: false,
    };
  }
}

export async function createMenu({ formData }: Props) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
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
      data: { name, price, assetUrl: imageUrl, description },
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
  console.log(formData);
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
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
        data: { name, price, assetUrl: imageUrl, description },
      });
    } else {
      const menu = await prisma.menu.update({
        where: { id },
        data: { name, price, description },
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
      message: "Something went wrong while creating addon category",
      isSuccess: false,
    };
  }
}

export async function createAddon(formData: FormData) {
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const addonCategoryId = Number(formData.get("addonCategory"));
  const isValid = name && addonCategoryId > 0;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    await prisma.addon.create({ data: { name, price, addonCategoryId } });
    revalidatePath("/backoffice/addon");
    return { message: "Created addon successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating addon",
      isSuccess: false,
    };
  }
}

export async function updateAddon(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const addonCategoryId = Number(formData.get("addonCategory"));
  const isValid = id && name && addonCategoryId > 0;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    await prisma.addon.update({
      where: { id },
      data: { name, price, addonCategoryId },
    });
    revalidatePath("/backoffice/addon");
    return { message: "Updated addon successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating addon",
      isSuccess: false,
    };
  }
}

export async function deleteAddon(id: number) {
  try {
    await prisma.addon.update({ where: { id }, data: { isArchived: true } });
    revalidatePath("/backoffice/addon");
    return { message: "Deleted addon successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting addon",
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

export async function updateSelectLocation(id: number) {
  try {
    const location = await fetchLocation();
    const disselectLocationIds = location
      .filter((item) => item.id !== id)
      .map((location) => location.id);
    await prisma.location.update({ where: { id }, data: { isSelected: true } });
    await prisma.$transaction(
      disselectLocationIds.map((item) =>
        prisma.location.update({
          where: { id: item },
          data: { isSelected: false },
        })
      )
    );
    revalidatePath("/backoffice");
  } catch (error) {
    console.log(error);
  }
}

export async function createLocation(formData: FormData) {
  const name = formData.get("name") as string;
  const street = formData.get("street") as string;
  const township = formData.get("township") as string;
  const city = formData.get("city") as string;
  const isValid = name && street && township && city;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    const company = await fetchCompany();
    company &&
      (await prisma.location.create({
        data: { companyId: company.id, name, street, township, city },
      }));
    revalidatePath("/backoffice");
    return { message: "Created location successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating location",
      isSuccess: false,
    };
  }
}

export async function updateLocation(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const street = formData.get("street") as string;
  const township = formData.get("township") as string;
  const city = formData.get("city") as string;
  const isValid = id && name && street && township && city;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    await prisma.location.update({
      where: { id },
      data: { name, street, township, city },
    });
    revalidatePath("/backoffice");
    return { message: "Updated location successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating location",
      isSuccess: false,
    };
  }
}

export async function deleteLocation(id: number) {
  try {
    const location = await fetchLocation();
    if (location.length < 2) {
      return {
        message: "Keep location least one",
        isSuccess: false,
      };
    }
    const isSelectedId = location.find((item) => item.isSelected === true)?.id;
    await prisma.location.update({
      where: { id },
      data: { isArchived: true, isSelected: false },
    });
    const location1 = await fetchLocation();
    if (isSelectedId === id) {
      await prisma.location.update({
        where: { id: location1[0].id },
        data: { isSelected: true },
      });
    }

    revalidatePath("/backoffice/location");
    return { message: "Deleted location successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting location",
      isSuccess: false,
    };
  }
}
export async function qrUploadCloudinary(imageDataUrl: string) {
  try {
    const response = await cloudinary.uploader.upload(imageDataUrl, {
      folder: "restaurant-pos/tableQr",
    });
    return response.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return null;
  }
}

export const generateQRCode = async (tableUrl: string) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);
    return qrCodeDataUrl;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export async function createTable(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    const locationId = (await fetchLocation()).find(
      (item) => item.isSelected === true
    )?.id;
    const table =
      locationId &&
      (await prisma.table.create({ data: { name, locationId, assetUrl: "" } }));
    const qrCodeData =
      table &&
      (await generateQRCode(`${config.orderAppUrl}?tableId=${table.id}`));
    const qrcodeImage = qrCodeData && (await qrUploadCloudinary(qrCodeData));
    if (qrcodeImage && table) {
      await prisma.table.update({
        where: { id: table.id },
        data: { assetUrl: qrcodeImage },
      });
    }
    revalidatePath("/backoffice/table");
    return { message: "Created table successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating table",
      isSuccess: false,
    };
  }
}

export async function handleDisableLocationMenu({
  available,
  menuId,
}: {
  available: boolean;
  menuId: number;
}) {
  try {
    const locationId = (await fetchSelectedLocation())?.id;
    if (available) {
      const item = await prisma.disabledLocationMenu.findFirst({
        where: { menuId, locationId },
      });
      item &&
        (await prisma.disabledLocationMenu.delete({ where: { id: item.id } }));
      revalidatePath("/backoffice/menu");
      return { message: "Enable available successfully.", isSuccess: true };
    } else {
      locationId &&
        (await prisma.disabledLocationMenu.create({
          data: { menuId, locationId },
        }));
      revalidatePath("/backoffice/menu");
      return { message: "Disable available successfully.", isSuccess: true };
    }
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while toggling available menu",
      isSuccess: false,
    };
  }
}

export async function handleDisableLocationMenuCat({
  available,
  menuCategoryId,
}: {
  available: boolean;
  menuCategoryId: number;
}) {
  try {
    const locationId = (await fetchSelectedLocation())?.id;
    if (available) {
      const item = await prisma.disabledLocationMenuCategory.findFirst({
        where: { menuCategoryId, locationId },
      });
      item &&
        (await prisma.disabledLocationMenuCategory.delete({
          where: { id: item.id },
        }));
      revalidatePath("/backoffice/menu-category");
      return { message: "Enable available successfully.", isSuccess: true };
    } else {
      locationId &&
        (await prisma.disabledLocationMenuCategory.create({
          data: { menuCategoryId, locationId },
        }));
      revalidatePath("/backoffice/menu-category");
      return { message: "Disable available successfully.", isSuccess: true };
    }
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while toggling available menu",
      isSuccess: false,
    };
  }
}

export async function updateTable(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const isValid = name && id;
  if (!isValid)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    await prisma.table.update({ where: { id }, data: { name } });
    revalidatePath("/backoffice/table");
    return { message: "Updated table successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating table",
      isSuccess: false,
    };
  }
}

export async function deleteTable(id: number) {
  try {
    await prisma.table.update({ where: { id }, data: { isArchived: true } });
    revalidatePath("/backoffice/table");
    return { message: "Deleted table successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting table",
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
