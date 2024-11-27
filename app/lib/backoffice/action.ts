"use server";

import { config } from "@/config";
import { prisma } from "@/db";
import { DISCOUNT, ORDERSTATUS } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import {
  fetchCompany,
  fetchFocCategoryAndFocMenu,
  fetchLocation,
  fetchMenuAddonCategory,
  fetchPromotionMenuWithPromoId,
  fetchSelectedLocation,
} from "./data";
import { OrderData, PaidData } from "@/general";
import { fetchOrderWithItemId } from "../order/data";
import { checkArraySame } from "@/function";

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
        ? ORDERSTATUS.PENDING
        : orderStatus === "cooking"
        ? ORDERSTATUS.COOKING
        : orderStatus === "complete"
        ? ORDERSTATUS.COMPLETE
        : orderStatus === "paid"
        ? ORDERSTATUS.PAID
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

export async function setNotiRead(id: number) {
  if (!id) return;
  try {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
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
    const qrCodeData =
      paidData[0].qrCode && (await generateQRCode(paidData[0].qrCode));
    const qrcodeImage = qrCodeData && (await qrUploadCloudinary(qrCodeData));

    return Promise.all(
      paidData.map(async (item) => {
        const addons: number[] = item.addons ? JSON.parse(item.addons) : [];
        if (addons.length > 0) {
          await Promise.all(
            addons.map(async (addon) => {
              await prisma.receipt.create({
                data: {
                  itemId: item.itemId,
                  code: item.receiptCode,
                  tableId: item.tableId,
                  addonId: addon,
                  menuId: item.menuId as number,
                  totalPrice: item.totalPrice as number,
                  quantity: item.quantity as number,
                  tax: item.tax as number,
                  date: item.date as Date,
                  qrCode: qrcodeImage as string,
                },
              });
            })
          );
        } else {
          await prisma.receipt.create({
            data: {
              itemId: item.itemId,
              code: item.receiptCode,
              tableId: item.tableId,
              menuId: item.menuId as number,
              totalPrice: item.totalPrice as number,
              quantity: item.quantity as number,
              tax: item.tax as number,
              date: item.date as Date,
              qrCode: qrcodeImage as string,
            },
          });
        }

        return qrcodeImage;
      })
    );
  } catch (error) {
    console.error(error);
  }
}

export async function setPaidWithQuantity(item: PaidData[]) {
  if (!item.length)
    return {
      message: "Missing required fields",
      isSuccess: false,
    };
  try {
    item.map(async (item) => {
      const currentOrder = await fetchOrderWithItemId(item.itemId);
      if (!currentOrder || !item.quantity)
        return {
          message: "Missing required fields",
          isSuccess: false,
        };
      const isPaid =
        currentOrder[0].paidQuantity + item.quantity ===
        currentOrder[0].quantity;
      const paidQuantity = currentOrder[0].paidQuantity + item.quantity;
      const status = isPaid ? ORDERSTATUS.PAID : ORDERSTATUS.COMPLETE;
      await prisma.order.updateMany({
        where: { itemId: item.itemId },
        data: { paidQuantity: paidQuantity, status },
      });
    });
    const qrCodeImageDb = await createReceipt(item);
    return {
      message: "Paided order successfully.",
      isSuccess: true,
      qrCodeImageDb,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while paiding order",
      isSuccess: false,
    };
  }
}

export async function createPromotion(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const discount_value = Number(formData.get("discount_amount"));
  const discountType = formData.get("discount_type") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const totalPrice = Number(formData.get("totalPrice"));
  const menuQty = JSON.parse(formData.get("menuQty") as string);
  const focMenu = JSON.parse(formData.get("focMenu") as string);
  const conditions = formData.get("conditions") as string;

  const isValid = Boolean(name && description && startDate && endDate);
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
      ? DISCOUNT.PERCENTAGE
      : discountType === "fixedValue"
      ? DISCOUNT.FIXED_AMOUNT
      : DISCOUNT.FOCMENU;

  const start_date = new Date(startDate);
  const end_date = new Date(endDate);

  try {
    const location = await fetchSelectedLocation();
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
        locationId: location?.id,
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
                quantity_requried: item.quantity,
              },
            })
        )
      );
    }

    revalidatePath(`/backoffice/promotion`);
    return { message: "Created promotion successfully.", isSuccess: true };
  } catch (error) {
    console.error(error);
    return {
      message: "Something went wrong while creating promotion",
      isSuccess: false,
    };
  }
}

export async function updatePromotion(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const discount_value = Number(formData.get("discount_amount"));
  const discountType = formData.get("discount_type") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const menuQty = JSON.parse(formData.get("menuQty") as string);
  const focMenu = JSON.parse(formData.get("focMenu") as string);
  const conditions = formData.get("conditions") as string;
  const totalPrice = Number(formData.get("totalPrice"));
  const isValid = Boolean(name && description && startDate && endDate);
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
      ? DISCOUNT.PERCENTAGE
      : discountType === "fixedValue"
      ? DISCOUNT.FIXED_AMOUNT
      : DISCOUNT.FOCMENU;

  const start_date = new Date(startDate);
  const end_date = new Date(endDate);

  const prevPromoMenu = await fetchPromotionMenuWithPromoId(id);
  const prevMenuId = prevPromoMenu.map((item) => item.menuId);

  try {
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
      },
    });
    const isMenuQty = Boolean(menuQty && menuQty.length && !totalPrice);
    if (!isMenuQty) {
      const allPromoMenuId = prevPromoMenu.map((promoMenu) => promoMenu.id);
      await prisma.promotionMenu.deleteMany({
        where: { id: { in: allPromoMenuId }, promotionId: id },
      });
    }
    if (isMenuQty) {
      menuQty.map(async (item: any) => {
        const samePromotionMenu = prevPromoMenu.find(
          (prevMenu) => prevMenu.menuId === Number(item.menuId)
        );
        if (
          item.quantity !== samePromotionMenu?.quantity_requried &&
          samePromotionMenu
        ) {
          await prisma.promotionMenu.update({
            where: { id: samePromotionMenu.id, promotionId: id },
            data: { quantity_requried: item.quantity },
          });
        }
      });
    }
    const toAdd =
      isMenuQty &&
      menuQty.filter((item: any) => !prevMenuId.includes(Number(item.menuId)));

    if (toAdd && toAdd.length > 0 && isMenuQty) {
      await Promise.all(
        toAdd.map(
          async (item: any) =>
            await prisma.promotionMenu.create({
              data: {
                promotionId: id,
                menuId: Number(item.menuId),
                quantity_requried: item.quantity,
              },
            })
        )
      );
    }

    const toRemove =
      isMenuQty &&
      prevPromoMenu.filter(
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
    if (discount_type === DISCOUNT.FOCMENU && focMenu && focMenu.length) {
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
      data: { status: ORDERSTATUS.CANCELED },
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
