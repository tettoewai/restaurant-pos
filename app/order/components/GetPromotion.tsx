"use client";
import { fetchAddonCategoryWithMenuId } from "@/app/lib/order/data";
import { OrderContext } from "@/context/OrderContext";
import { Button } from "@nextui-org/react";
import { Menu, PromotionMenu } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext } from "react";

export default function GetPromotion({
  promotionMenu,
  menus,
}: {
  promotionMenu?: PromotionMenu[];
  menus: Menu[];
}) {
  const numbers = "0123456789";
  const generateNumericID = customAlphabet(numbers, 7);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const router = useRouter();

  const { carts, setCarts } = useContext(OrderContext);
  const { promotionQue, setPromotionQue } = useContext(OrderContext);

  const handleGetPromotion = async () => {
    if (promotionMenu?.length) {
      let updatedPromotionQue = [...promotionQue];
      for (const item of promotionMenu || []) {
        const addonCategory = await fetchAddonCategoryWithMenuId(item.menuId);
        const isRequired = addonCategory?.filter(
          (addonCat) => addonCat.isRequired
        );

        if (isRequired && isRequired.length) {
          updatedPromotionQue = [...updatedPromotionQue, item];
          setPromotionQue(updatedPromotionQue);
        } else {
          const isExist = carts.find(
            (exist) => exist.menuId === item.menuId && exist.addons.length === 0
          );

          if (isExist) {
            const otherItem = carts.filter((cart) => cart.id !== isExist.id);
            setCarts([
              ...otherItem,
              {
                ...isExist,
                quantity: isExist.quantity + item.quantity_required,
              },
            ]);
          } else {
            setCarts([
              ...carts,
              {
                id: generateNumericID(),
                menuId: item.menuId,
                addons: [],
                quantity: item.quantity_required,
              },
            ]);
          }
        }
      }
      if (updatedPromotionQue && updatedPromotionQue.length) {
        const firstMenu = updatedPromotionQue[0];
        if (firstMenu) {
          const url = `/order/${firstMenu.menuId}?tableId=${tableId}&promotionId=${firstMenu.promotionId}&requiredQty=${firstMenu.quantity_required}`;
          router.push(url);
        }
      }
    } else {
      router.push(`/order?tableId=${tableId}`);
    }
  };

  return (
    <Button
      onClick={handleGetPromotion}
      className="text-white bg-primary w-full"
    >
      Get Promotion
    </Button>
  );
}
