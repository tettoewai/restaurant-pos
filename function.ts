import { Promotion, PromotionMenu, PromotionUsage } from "@prisma/client";
import {
  fetchAddonCategoryWithIds,
  fetchMenuAddonCategoryWithMenuIds,
} from "./app/lib/backoffice/data";
import { weekday } from "./general";

export const dateToString = ({
  date,
  type,
}: {
  date: Date;
  type: "DMY" | "YMD";
}) => {
  const dayDate =
    date.getDate() < 10 ? "0" + String(date.getDate()) : date.getDate();
  const month =
    date.getMonth() + 1 < 10
      ? "0" + String(date.getMonth() + 1)
      : date.getMonth() + 1;
  return type === "DMY"
    ? dayDate + "-" + month + "-" + date.getFullYear()
    : date.getFullYear() + "-" + month + "-" + dayDate;
};

export const formatCurrency = (value: number) => {
  return (
    new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0, // Ensures no decimals
    }).format(value) + " Ks"
  );
};

export const convert12Hour = (time: string) => {
  const [hour, minute] = time.split(":");

  const hourNumber = parseInt(hour, 10);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 || 12;

  return `${hour12}:${minute} ${period}`;
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
  promotionUsage: PromotionUsage[];
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
          const promotionUsageTime = promotionUsage.filter(
            (promoUsage) => promoUsage.promotionId === item.promotionId
          ).length;
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
      const totalPricePromotionUsage = promotionUsage.filter(
        (item) => item.promotionId === promotion.id
      );
      const requiredTotalPrice =
        totalPricePromotionUsage.length > 0 && promotion.totalPrice
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
  const now = new Date(); // Current time in UTC by default

  // Convert now to Myanmar time
  const myanmarOffset = 6.5 * 60; // Myanmar is UTC+6:30
  const myanmarNow = new Date(now.getTime() + myanmarOffset * 60 * 1000);

  // Parse startTime and endTime as UTC
  const start = new Date(
    myanmarNow.toISOString().split("T")[0] + "T" + startTime + "Z"
  );
  const end = new Date(
    myanmarNow.toISOString().split("T")[0] + "T" + endTime + "Z"
  );
  return myanmarNow >= start && myanmarNow <= end;
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
