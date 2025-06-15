import {
  Promotion,
  PromotionMenu,
  PromotionUsage,
  PurchaseOrder,
  PurchaseOrderItem,
  Receipt,
  Unit,
  UnitCategory,
} from "@prisma/client";
import {
  fetchAddonCategoryWithIds,
  fetchMenuAddonCategoryWithMenuIds,
} from "./app/lib/backoffice/data";
import { POItemForm } from "./app/warehouse/purchase-order/new/page";
import { weekday } from "./general";

export const dateToString = ({
  date,
  type,
  withHour,
}: {
  date: Date;
  type: "DMY" | "YMD";
  withHour?: boolean;
}) => {
  const dayDate =
    date.getDate() < 10 ? "0" + String(date.getDate()) : date.getDate();
  const month =
    date.getMonth() + 1 < 10
      ? "0" + String(date.getMonth() + 1)
      : date.getMonth() + 1;
  const hour = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const time = `, ${convert12Hour(
    `${hour < 10 ? "0" + hour : hour}:${
      minutes < 10 ? "0" + minutes : minutes
    }:${seconds < 10 ? "0" + seconds : seconds}`
  )}`;
  const dateInString =
    type === "DMY"
      ? dayDate + "-" + month + "-" + date.getFullYear()
      : date.getFullYear() + "-" + month + "-" + dayDate;
  return withHour ? dateInString + time : dateInString;
};

export const formatCurrency = (value: number) => {
  return (
    new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0, // Ensures no decimals
    }).format(value) + " Ks"
  );
};

export function formatReceipt(receipts: Receipt[]) {
  const uniqueItem = [] as string[];
  receipts.map((receipt) => {
    const isExist = uniqueItem.find((item) => item === receipt.itemId);
    if (!isExist) uniqueItem.push(receipt.itemId);
  });
  return uniqueItem.map((item) => {
    const validReceipt = receipts.find((receipt) => receipt.itemId === item);
    const validReceipts = receipts.filter((receipt) => receipt.itemId === item);
    return {
      menuId: validReceipt?.menuId,
      quantity: validReceipt?.quantity,
      addons: validReceipts.map((item) => item.addonId),
      subTotal: validReceipt?.subTotal || 0,
      isFoc: validReceipt?.isFoc,
    };
  });
}

export const convert12Hour = (time: string) => {
  const [hour, minute, seconds] = time.split(":");

  const hourNumber = parseInt(hour, 10);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 || 12;

  return `${hour12}:${minute}:${seconds} ${period}`;
};

export function checkArraySame(
  array1: number[] | string[],
  array2: number[] | string[]
) {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

export function convertMyanmarTime(date: Date) {
  const myanmarOffset = 6.5 * 60; // Myanmar is UTC+6:30
  return new Date(date.getTime() + myanmarOffset * 60 * 1000);
}

export function calculateApplicablePromotions({
  promotions,
  promotionMenus,
  menuOrderData,
  totalPrice,
  promotionUsage,
}: {
  promotions?: Promotion[];
  promotionMenus?: PromotionMenu[];
  menuOrderData: Record<
    number,
    {
      menuId: number;
      quantity: number;
    }
  >;
  totalPrice?: number;
  promotionUsage: PromotionUsage[] | undefined;
}) {
  return promotions
    ?.filter((promotion) => {
      const conditions =
        promotion.conditions && JSON.parse(promotion.conditions.toString());
      const days: string =
        conditions &&
        conditions.length &&
        conditions
          .map((item: any) => (item.days ? item.days : []))
          .filter((item: any) => item !== undefined)
          .join(", ");

      const promotionAvailabel = checkPromotionDuration({ days, conditions });

      if (!promotionAvailabel) return false;

      const currentMenuPromo = promotionMenus
        ?.filter((item) => item.promotionId === promotion.id)
        .filter((item) => item !== undefined);

      if (currentMenuPromo && currentMenuPromo.length) {
        // check required quantity
        const applicableMenuPromotion = currentMenuPromo.filter((item) => {
          // check promotion usage and if usage add required
          const promotionUsageTime =
            promotionUsage && promotionUsage.length
              ? promotionUsage.filter(
                  (promoUsage) => promoUsage.promotionId === item.promotionId
                ).length
              : 0;
          const requiredQuantity =
            promotionUsageTime > 0
              ? item.quantity_required +
                item.quantity_required * promotionUsageTime
              : item.quantity_required;
          return (
            menuOrderData[item.menuId] &&
            menuOrderData[item.menuId].quantity >= requiredQuantity
          );
        });
        return (
          applicableMenuPromotion &&
          applicableMenuPromotion.length === currentMenuPromo.length
        );
      }
      // check totalPrice
      const totalPricePromotionUsage = promotionUsage?.filter(
        (item) => item.promotionId === promotion.id
      );
      const requiredTotalPrice =
        totalPricePromotionUsage &&
        totalPricePromotionUsage.length > 0 &&
        promotion.totalPrice
          ? promotion.totalPrice +
            promotion.totalPrice * totalPricePromotionUsage.length
          : promotion.totalPrice
          ? promotion.totalPrice
          : 0;
      return (
        promotion.totalPrice && totalPrice && totalPrice >= requiredTotalPrice
      );
    })
    .sort((a, b) => {
      if (a.priority === b.priority) {
        // Get menus related to each promotion
        const validPromoMenuA =
          promotionMenus?.filter((item) => item.promotionId === a.id) || [];
        const validPromoMenuB =
          promotionMenus?.filter((item) => item.promotionId === b.id) || [];

        // Sort promotions with more menu promotions first
        if (validPromoMenuA.length !== validPromoMenuB.length) {
          return validPromoMenuB.length - validPromoMenuA.length; // Descending order
        }

        // Fallback to compare based on totalPrice
        if (a.totalPrice && b.totalPrice) {
          return b.totalPrice - a.totalPrice;
        }
      }

      // Default to sorting by priority
      return b.priority - a.priority;
    });
}

export async function checkMenuRequiredAddonCat(focMenuIds: number[]) {
  const menuAddonCategory = await fetchMenuAddonCategoryWithMenuIds(focMenuIds);

  const addonCategory = await fetchAddonCategoryWithIds(
    menuAddonCategory.map((item) => item.addonCategoryId)
  );

  const menuRequiredAddonCat = menuAddonCategory.reduce(
    (
      acc: {
        menuId: number;
        addonCategoryIds: number[];
      }[],
      menuAddonCat
    ) => {
      // Find the addonCategory associated with the current menuAddonCategory
      const currentAddonCat = addonCategory?.find(
        (item) => item.id === menuAddonCat.addonCategoryId && item.isRequired
      );

      // If a required addonCategory is found, add it to the accumulator
      if (currentAddonCat) {
        const existingMenu = acc.find(
          (entry: any) => entry.menuId === menuAddonCat.menuId
        );

        if (existingMenu) {
          // If the menuId already exists in the accumulator, push the addonCategoryId
          existingMenu.addonCategoryIds.push(menuAddonCat.addonCategoryId);
        } else {
          // If the menuId doesn't exist, create a new entry with addonCategoryId
          acc.push({
            menuId: menuAddonCat.menuId,
            addonCategoryIds: [menuAddonCat.addonCategoryId],
          });
        }
      }

      return acc;
    },
    []
  );
  return menuRequiredAddonCat;
}

export function checkTimeInDuration({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}) {
  const date = new Date();

  // Parse startTime and endTime as UTC
  const start = new Date(
    date.toISOString().split("T")[0] + "T" + startTime + "Z"
  );
  const end = new Date(date.toISOString().split("T")[0] + "T" + endTime + "Z");
  return date >= start && date <= end;
}

export function checkPromotionDuration({
  days,
  conditions,
}: {
  days: string;
  conditions: any;
}) {
  const date = new Date();
  const nowDay = weekday[date.getDay()];
  const promotionDays = days ? days.split(",") : [];
  const availablePromoDay = promotionDays && promotionDays.includes(nowDay);

  const timeDuration: { startTime: string; endTime: string } =
    conditions &&
    conditions.length &&
    conditions.find((item: any) => item.startTime && item.endTime);

  const availablePromoTime =
    timeDuration &&
    checkTimeInDuration({
      startTime: timeDuration.startTime,
      endTime: timeDuration.endTime,
    });

  return promotionDays.length && !timeDuration
    ? availablePromoDay
    : timeDuration && !promotionDays.length
    ? availablePromoTime
    : promotionDays.length && timeDuration
    ? availablePromoDay && availablePromoTime
    : true;
}

export function roundToTwoDecimal(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function convertUnit({
  amount,
  toUnit,
}: {
  amount: number;
  toUnit: Unit;
}): number {
  // amount is in base unit (g, ml, or UNIT)
  switch (toUnit) {
    case Unit.KG:
    case Unit.L:
      return amount / 1000;
    case Unit.VISS:
      return amount / 1632.932532;
    case Unit.LB:
      return amount / 453.592;
    case Unit.OZ:
      return amount / 28.3495;
    case Unit.GAL:
      return amount / 3785.41;
    case Unit.DOZ:
      return amount / 12;
    default:
      return amount;
  }
}

export function convertBaseUnit({
  amount,
  fromUnit,
}: {
  amount: number;
  fromUnit: Unit;
}): number {
  // return amount in base unit (g, ml, or UNIT)
  switch (fromUnit) {
    case Unit.KG:
    case Unit.L:
      return amount * 1000;
    case Unit.VISS:
      return amount * 1632.932532;
    case Unit.LB:
      return amount * 453.592;
    case Unit.OZ:
      return amount * 28.3495;
    case Unit.GAL:
      return amount * 3785.41;
    case Unit.DOZ:
      return amount * 12;
    default:
      return amount;
  }
}

export function captilize(s: string) {
  return s[0].toUpperCase() + s.toLowerCase().slice(1);
}

export function validUnits(unitCategory: UnitCategory) {
  if (unitCategory === UnitCategory.MASS) {
    return ["G", "Kg", "Lb", "Oz", "Viss"];
  } else if (unitCategory === UnitCategory.VOLUME) {
    return ["Ml", "L", "Gal"];
  } else if (unitCategory === UnitCategory.COUNT) {
    return ["Doz", "Unit"];
  } else {
    return [""];
  }
}

export function getPODataDiff(
  original: PurchaseOrder,
  update: { supplierId: number; warehouseId: number }
) {
  const diff: Record<string, any> = {};
  if (
    original.supplierId !== update.supplierId ||
    original.warehouseId !== update.warehouseId
  ) {
    if (original.supplierId !== update.supplierId) {
      diff["supplierId"] = {
        old: original.supplierId,
        new: update.supplierId,
      };
    }
    if (original.warehouseId !== update.warehouseId) {
      diff["warehouseId"] = {
        old: original.warehouseId,
        new: update.warehouseId,
      };
    }
    return diff;
  } else {
    return undefined;
  }
}

export function checkPOItemChange(
  updateData: POItemForm[],
  originalPOItem: PurchaseOrderItem[]
) {
  if (updateData.length !== originalPOItem.length) {
    return true;
  }
  for (let x = 0; x < updateData.length; x++) {
    if (
      updateData[x].itemId !== originalPOItem[x].itemId ||
      updateData[x].price !== originalPOItem[x].unitPrice ||
      updateData[x].quantity !== originalPOItem[x].quantity
    ) {
      return true;
    } else {
      return false;
    }
  }
}

export function getPOItemDataDiff(
  originalPOItem: PurchaseOrderItem[],
  update: POItemForm[]
) {
  const updateData = update.map((item) => {
    const baseQuantity = convertBaseUnit({
      amount: item.quantity || 0,
      fromUnit: item.unit.toUpperCase() as Unit,
    });
    return { ...item, quantity: Math.round(baseQuantity) };
  });

  const isChange = checkPOItemChange(updateData, originalPOItem);

  if (isChange) {
    const diff = { old: originalPOItem, new: updateData };
    return diff;
  } else {
    return undefined;
  }
}
