import { Promotion, PromotionMenu } from "@prisma/client";

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
}) {
  return promotions
    ?.filter((promotion) => {
      const currentMenuPromo = promotionMenus
        ?.filter((item) => item.promotionId === promotion.id)
        .filter((item) => item !== undefined);
      if (currentMenuPromo && currentMenuPromo.length) {
        const applicableMenuPromotion = currentMenuPromo.filter(
          (item) =>
            menuOrderData[item.menuId] &&
            menuOrderData[item.menuId].quantity >= item.quantity_required
        );
        return (
          applicableMenuPromotion &&
          applicableMenuPromotion.length === currentMenuPromo.length
        );
      }
      return (
        promotion.totalPrice && totalPrice && totalPrice >= promotion.totalPrice
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
