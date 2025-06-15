"use server";

import { config } from "@/config";
import { prisma } from "@/db";
import { PaidData } from "@/general";
import { DiscountType, OrderStatus } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { fetchOrderWithItemId } from "../order/data";
import {
  fetchCompany,
  fetchFocCategoryAndFocMenu,
  fetchFocMenuAddonCategoryWithPromotionId,
  fetchLocation,
  fetchMenuAddonCategory,
  fetchPromotionMenuWithPromoId,
  fetchSelectedLocation,
  fetchUser,
} from "./data";

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
  const data = Object.fromEntries(formData);
  const name = data.name as string;
  const description = data.description as string;
  const price = Number(data.price);
  const category = (data.category as string).split(",");
  const image = data.image;
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
  const data = Object.fromEntries(formData);
  const id = Number(data.id);
  const name = data.name as string;
  const description = data.description as string;
  const price = Number(data.price);
  const category = (data.category as string).split(",");
  const categoryIds = category.map((item) => Number(item));
  const image = data.image;
  const isValid = id && name && price > 0 && category.length > 0;
  if (!isValid) return { message: "Missing required fields", isSuccess: false };
  try {
    if (image) {
      const imageUrl = (await uploadImage(formData)) as string;
      await prisma.menu.update({
        where: { id },
        data: { name, price, assetUrl: imageUrl, description },
      });
    } else {
      await prisma.menu.update({
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
  const data = Object.fromEntries(formData);

  const id = Number(data.id);
  const name = data.name as string;
  const price = Number(data.price);
  const addonCategoryId = Number(data.addonCategory);
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
    await prisma.addonCategory.update({
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
  if (!id) return { message: "Missing required fields.", isSuccess: false };
  try {
    const user = await fetchUser();
    if (!user) return { message: "Someting went wrong.", isSuccess: false };
    await prisma.selectedLocation.deleteMany({ where: { userId: user.id } });
    await prisma.selectedLocation.create({
      data: { userId: user?.id, locationId: id },
    });
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
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;
  const isValid = name && street && township && city;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    const company = await fetchCompany();
    company &&
      (await prisma.location.create({
        data: {
          companyId: company.id,
          name,
          street,
          township,
          city,
          latitude,
          longitude,
        },
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
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;
  const isValid = id && name && street && township && city;
  if (!isValid)
    return { message: "Missing required fields.", isSuccess: false };
  try {
    await prisma.location.update({
      where: { id },
      data: { name, street, township, city, latitude, longitude },
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
    const selectedLocation = await fetchSelectedLocation();
    if (location.length < 2) {
      return {
        message: "Keep location least one",
        isSuccess: false,
      };
    }
    const isSelectedId = selectedLocation?.locationId === id;
    await prisma.location.update({
      where: { id },
      data: { isArchived: true },
    });
    if (isSelectedId) {
      const updatedLocation = await fetchLocation();
      const firstLocation = updatedLocation[0];
      await updateSelectLocation(firstLocation.id);
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
    const locationId = (await fetchSelectedLocation())?.locationId;
    locationId && (await prisma.table.create({ data: { name, locationId } }));
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
    const locationId = (await fetchSelectedLocation())?.locationId;
    if (available) {
      try {
        const item = await prisma.disabledLocationMenu.findFirst({
          where: { menuId, locationId },
        });
        item &&
          (await prisma.disabledLocationMenu.delete({
            where: { id: item.id },
          }));
        revalidatePath("/backoffice/menu");
        return { message: "Enable available successfully.", isSuccess: true };
      } catch (error) {
        console.log(error);
        return {
          message: "Something went wrong while toggling available menu",
          isSuccess: false,
        };
      }
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
    const locationId = (await fetchSelectedLocation())?.locationId;
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

export async function deleteMenuImage(id: number) {
  try {
    const menu = await prisma.menu.update({
      where: { id },
      data: { assetUrl: "" },
    });
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while deleting image",
      isSuccess: false,
    };
  }
}

export async function deletePromotionImage(id: number) {
  try {
    await prisma.promotion.update({
      where: { id },
      data: { imageUrl: "" },
    });
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while deleting image",
      isSuccess: false,
    };
  }
}

export async function updateOrderStatus({
  orderStatus,
  itemId,
}: {
  orderStatus: string;
  itemId: string;
}) {
  try {
    const orders = await prisma.order.findMany({ where: { itemId } });
    if (orders[0].status === orderStatus.toUpperCase())
      return { message: "Updated order status successfully.", isSuccess: true };
    const orderIds = orders.map((item) => item.id);
    const status =
      orderStatus === "pending"
        ? OrderStatus.PENDING
        : orderStatus === "cooking"
        ? OrderStatus.COOKING
        : orderStatus === "complete"
        ? OrderStatus.COMPLETE
        : orderStatus === "paid"
        ? OrderStatus.PAID
        : undefined;
    if (!status)
      return {
        message: "Something went wrong while update status",
        isSuccess: false,
      };
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status },
    });
    revalidatePath(`/backoffice/order`);
    return { message: "Updated order status successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while update status",
      isSuccess: false,
    };
  }
}

export async function createFocMenuAddonCategory({
  focAddonCategory,
  promotionId,
}: {
  focAddonCategory: {
    menuId: number;
    addonCategoryId: number;
    addonId: number;
  }[];
  promotionId?: number;
}) {
  if (!promotionId)
    return {
      message: "Promotion's id is not provided.",
      isSuccess: false,
    };
  try {
    const dataWithPromotionId = focAddonCategory.map((item) => ({
      ...item,
      promotionId,
    }));
    await prisma.focMenuAddonCategory.createMany({
      data: dataWithPromotionId,
    });
    revalidatePath("/backoffice/promotion");
    return {
      message: `Created ${focAddonCategory.length} focMenuAddonCategory(ies) successfully.`,
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while create FocMenuAddonCategory",
      isSuccess: false,
    };
  }
}

export async function updateFocMenuAddonCategory({
  focAddonCategory,
  promotionId,
}: {
  focAddonCategory: {
    menuId: number;
    addonCategoryId: number;
    addonId: number;
  }[];
  promotionId: number;
}) {
  if (!promotionId && !focAddonCategory.length)
    return {
      message: "Something went wrong!",
      isSuccess: false,
    };
  try {
    const prevFocMenuAddonCat = await fetchFocMenuAddonCategoryWithPromotionId(
      promotionId
    );
    const toRemove = prevFocMenuAddonCat.filter(
      (focMenuAddonCat) =>
        !focAddonCategory.find(
          (item) =>
            item.menuId === focMenuAddonCat.menuId &&
            item.addonCategoryId === focMenuAddonCat.addonCategoryId &&
            item.addonId === focMenuAddonCat.addonId
        )
    );
    const toAdd = focAddonCategory.filter(
      (focAddonCat) =>
        !prevFocMenuAddonCat.find(
          (item) =>
            item.menuId === focAddonCat.menuId &&
            item.addonCategoryId === focAddonCat.addonCategoryId &&
            item.addonId === focAddonCat.addonId
        )
    );
    if (toRemove.length) {
      await prisma.focMenuAddonCategory.deleteMany({
        where: { promotionId, id: { in: toRemove.map((item) => item.id) } },
      });
    }
    if (toAdd.length) {
      await createFocMenuAddonCategory({
        focAddonCategory: toAdd,
        promotionId,
      });
    }
    return {
      message: `Updated FOC menu addon-category successfully.`,
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating FocMenuAddonCategory",
      isSuccess: false,
    };
  }
}

export async function deleteFocMenuAddonCategoryWithPromoId(
  promotionId: number
) {
  if (!promotionId) return;
  try {
    await prisma.focMenuAddonCategory.deleteMany({ where: { promotionId } });
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while deleting focMenuAddonCategory",
      isSuccess: false,
    };
  }
}

export async function setNotiRead(id: number) {
  if (!id) return;
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/backoffice");
  } catch (error) {
    console.log(error);
  }
}

export async function setNotiReadWithTableId(id: number) {
  if (!id) return;
  try {
    await prisma.notification.updateMany({
      where: { tableId: id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/backoffice");
  } catch (error) {
    console.log(error);
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

export async function createReceipt(paidData: PaidData[]) {
  if (!paidData.length) return;
  try {
    return Promise.all(
      paidData.map(async (item) => {
        const baseData = {
          itemId: item.itemId,
          code: item.receiptCode,
          tableId: item.tableId,
          menuId: item.menu?.id as number,
          totalPrice: item.totalPrice as number,
          quantity: item.quantity as number,
          tax: item.tax as number,
          date: item.date as Date,
          subTotal: item.subTotal,
          isFoc: item.isFoc,
        };

        // Handle addons if present
        if (item.addons?.length) {
          await Promise.all(
            item.addons.map((addon) =>
              prisma.receipt.create({
                data: {
                  ...baseData,
                  addonId: addon.id,
                },
              })
            )
          );
        } else {
          await prisma.receipt.create({ data: baseData });
        }
      })
    );
  } catch (error) {
    console.error(error);
  }
}

export async function setPaidWithQuantity(item: PaidData[]) {
  if (!item.length) {
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  }

  try {
    for (const data of item) {
      const currentOrder = await fetchOrderWithItemId(data.itemId);

      if (!currentOrder || !data.quantity) {
        return {
          message: "Missing required fields",
          isSuccess: false,
        };
      }
      // overPaid is for protect bug sometime occur
      const overPaid =
        currentOrder[0].paidQuantity + data.quantity > currentOrder[0].quantity;
      if (overPaid)
        return {
          message: "Something went worng with over paid.",
          isSuccess: false,
        };

      const isPaid =
        currentOrder[0].paidQuantity + data.quantity ===
        currentOrder[0].quantity;
      const paidQuantity = currentOrder[0].paidQuantity + data.quantity;
      const status = isPaid ? OrderStatus.PAID : OrderStatus.COMPLETE;

      await prisma.order.updateMany({
        where: { itemId: data.itemId },
        data: { paidQuantity, status },
      });
    }

    await createReceipt(item);

    return {
      message: "Paid order successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while processing the payment.",
      isSuccess: false,
    };
  }
}

export async function createPromotion(formData: FormData) {
  const data = Object.fromEntries(formData);
  const name = data.name as string;
  const description = data.description as string;
  const discount_value = Number(data.discount_amount);
  const discountType = data.discount_type as string;
  const startDate = data.start_date as string;
  const endDate = data.end_date as string;
  const totalPrice = Number(data.totalPrice);
  const menuQty = JSON.parse(data.menuQty as string);
  const focMenu = JSON.parse(data.focMenu as string);
  const image = data.image;
  const priority = Number(data.priority);
  const group = data.group as string;
  const conditions = data.conditions as string;

  const isValid = Boolean(
    name && description && startDate && endDate && priority
  );
  if (discountType === "foc") {
    const focValid = focMenu && focMenu.length > 0 && !discount_value;
    if (!focValid)
      return {
        message: "Missing required foc fields!",
        isSuccess: false,
      };
  }
  if (!isValid)
    return {
      message: "Missing required fields!",
      isSuccess: false,
    };
  const discount_type =
    discountType === "percentage"
      ? DiscountType.PERCENTAGE
      : discountType === "fixedValue"
      ? DiscountType.FIXED_AMOUNT
      : DiscountType.FOCMENU;

  const start_date = new Date(startDate);
  const end_date = new Date(endDate);

  try {
    let imageUrl: string | null = null;

    if (image) {
      imageUrl = (await uploadImage(formData)) as string;
    }
    const location = await fetchSelectedLocation();
    if (!location)
      return {
        message: "Location id is not provided.",
        isSuccess: false,
      };
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        discount_value,
        discount_type,
        start_date,
        end_date,
        conditions,
        totalPrice,
        locationId: location.id,
        imageUrl,
        priority,
        group,
      },
    });

    if (focMenu && focMenu.length > 0 && !discount_value) {
      await Promise.all(
        focMenu.map(async (item: any) => {
          const focCategory = await prisma.focCategory.create({
            data: { minSelection: item.quantity, promotionId: promotion.id },
          });
          item.menuId.map(async (item: any) => {
            await prisma.focMenu.create({
              data: { menuId: Number(item), focCategoryId: focCategory.id },
            });
          });
        })
      );
    }
    if (menuQty && menuQty.length > 0 && !totalPrice) {
      await Promise.all(
        menuQty.map(
          async (item: any) =>
            await prisma.promotionMenu.create({
              data: {
                promotionId: promotion.id,
                menuId: Number(item.menuId),
                quantity_required: item.quantity,
              },
            })
        )
      );
    }

    revalidatePath(`/backoffice/promotion`);
    return {
      message: "Created promotion successfully.",
      isSuccess: true,
      promotionId: promotion.id,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating promotion",
      isSuccess: false,
    };
  }
}

export async function updatePromotion(formData: FormData) {
  const data = Object.fromEntries(formData);
  const id = Number(data.id);
  const name = data.name as string;
  const description = data.description as string;
  const discount_value = Number(data.discount_amount);
  const discountType = data.discount_type as string;
  const startDate = data.start_date as string;
  const endDate = data.end_date as string;
  const menuQty = JSON.parse(data.menuQty as string);
  const focMenu = JSON.parse(data.focMenu as string);
  const conditions = data.conditions as string;
  const priority = Number(data.priority);
  const image = data.image;
  const group = data.group as string;
  const totalPrice = Number(data.totalPrice);

  const isValid = Boolean(
    name && description && startDate && endDate && priority
  );
  if (discountType === "foc") {
    const focValid = focMenu && focMenu.length > 0 && !discount_value;
    if (!focValid)
      return {
        message: "Missing required foc fields!",
        isSuccess: false,
      };
  }
  if (!isValid)
    return {
      message: "Missing required fields!",
      isSuccess: false,
    };

  const discount_type =
    discountType === "percentage"
      ? DiscountType.PERCENTAGE
      : discountType === "fixedValue"
      ? DiscountType.FIXED_AMOUNT
      : DiscountType.FOCMENU;

  const start_date = new Date(startDate);
  const end_date = new Date(endDate);

  const prevPromoMenu = await fetchPromotionMenuWithPromoId(id);
  const prevMenuId = prevPromoMenu && prevPromoMenu.map((item) => item.menuId);

  try {
    if (image) {
      const imageUrl = (await uploadImage(formData)) as string;
      await prisma.promotion.update({
        where: { id },
        data: {
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          conditions,
          totalPrice,
          imageUrl,
          priority,
          group,
        },
      });
    } else {
      await prisma.promotion.update({
        where: { id },
        data: {
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          conditions,
          totalPrice,
          priority,
          group,
        },
      });
    }

    const isMenuQty = Boolean(menuQty && menuQty.length && !totalPrice);
    if (!isMenuQty) {
      const allPromoMenuId = prevPromoMenu?.map((promoMenu) => promoMenu.id);
      await prisma.promotionMenu.deleteMany({
        where: { id: { in: allPromoMenuId }, promotionId: id },
      });
    }
    if (isMenuQty) {
      menuQty.map(async (item: any) => {
        const samePromotionMenu = prevPromoMenu?.find(
          (prevMenu) => prevMenu.menuId === Number(item.menuId)
        );
        if (
          item.quantity !== samePromotionMenu?.quantity_required &&
          samePromotionMenu
        ) {
          await prisma.promotionMenu.update({
            where: { id: samePromotionMenu.id, promotionId: id },
            data: { quantity_required: item.quantity },
          });
        }
      });
    }
    const toAdd =
      isMenuQty &&
      menuQty.filter((item: any) => !prevMenuId?.includes(Number(item.menuId)));

    if (toAdd && toAdd.length > 0 && isMenuQty) {
      await Promise.all(
        toAdd.map(
          async (item: any) =>
            await prisma.promotionMenu.create({
              data: {
                promotionId: id,
                menuId: Number(item.menuId),
                quantity_required: item.quantity,
              },
            })
        )
      );
    }

    const toRemove =
      isMenuQty &&
      prevPromoMenu?.filter(
        (item) =>
          !menuQty.find(
            (menuqty: any) => Number(menuqty.menuId) === item.menuId
          )
      );
    if (toRemove && toRemove.length > 0 && isMenuQty) {
      await Promise.all(
        toRemove.map(
          async (item) =>
            await prisma.promotionMenu.delete({
              where: { promotionId: id, id: Number(item.id) },
            })
        )
      );
    }
    const focData = await fetchFocCategoryAndFocMenu(id);
    const focCategoryIds = focData.focCategory.map((item) => item.id);
    const focMenuIds = focData.focMenu.map((item) => item.id);

    await prisma.focMenu.deleteMany({ where: { id: { in: focMenuIds } } });
    await prisma.focCategory.deleteMany({
      where: { id: { in: focCategoryIds }, promotionId: id },
    });
    if (discount_type === DiscountType.FOCMENU && focMenu && focMenu.length) {
      await Promise.all(
        focMenu.map(async (item: any) => {
          const focCategory = await prisma.focCategory.create({
            data: { promotionId: id, minSelection: Number(item.quantity) },
          });
          item.menuId.map(
            async (menu: any) =>
              await prisma.focMenu.create({
                data: { focCategoryId: focCategory.id, menuId: Number(menu) },
              })
          );
        })
      );
    }
    revalidatePath(`/backoffice/promotion`);
    return { message: "Updated promotion successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while updating promotion",
      isSuccess: false,
    };
  }
}

export async function deletePromotion(id: number) {
  try {
    await prisma.promotion.update({
      where: { id: id },
      data: { isArchived: true },
    });
    revalidatePath("/backoffice/promotion");
    return { message: "Deleted promotion successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting promotion",
      isSuccess: false,
    };
  }
}

export async function handleActivePromotion({
  id,
  e,
}: {
  e: boolean;
  id: number;
}) {
  if (!e && !id)
    return {
      message: "Something went wrong while handlieng promotion status",
      isSuccess: false,
    };
  try {
    await prisma.promotion.update({ where: { id }, data: { is_active: e } });
    revalidatePath("/backoffice/promotion");
    return {
      message: "Changed promotion status successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while handlieng promotion status",
      isSuccess: false,
    };
  }
}

export async function cancelOrder(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const reason = formData.get("cancelReason") as string;
  const isValid = itemId && reason;
  if (!isValid)
    return {
      message: "Missing required field",
      isSuccess: false,
    };
  try {
    await prisma.canceledOrder.create({ data: { itemId, reason } });
    await prisma.order.updateMany({
      where: { itemId },
      data: { status: OrderStatus.CANCELED },
    });
    revalidatePath(`/backoffice/order`);
    return { message: "Canceled order successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while canceling order.",
      isSuccess: false,
    };
  }
}
