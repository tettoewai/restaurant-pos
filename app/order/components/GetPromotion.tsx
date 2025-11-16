"use client";
import { fetchAddonCategoryWithMenuIds } from "@/app/lib/order/data";
import { CartItem, OrderContext } from "@/context/OrderContext";
import { Button, Spinner } from "@heroui/react";
import { Menu, PromotionMenu } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";

export default function GetPromotion({
  promotionMenu,
  menus,
  promotionAvailabel,
}: {
  promotionMenu?: PromotionMenu[];
  menus: Menu[];
  promotionAvailabel: boolean;
}) {
  const numbers = "0123456789";
  const generateNumericID = customAlphabet(numbers, 7);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const router = useRouter();

  const { carts, setCarts } = useContext(OrderContext);
  const { promotionQue, setPromotionQue } = useContext(OrderContext);

  const [checkingRequiredAddonCat, setCheckingRequiredAddonCat] =
    useState(false);

  const handleGetPromotion = async () => {
    if (promotionMenu?.length) {
      let updatedPromotionQue = [...promotionQue];
      const promotionMenuIds = promotionMenu.map((item) => item.menuId);
      setCheckingRequiredAddonCat(true);
      const { addonCategories, menuAddonCategory } =
        await fetchAddonCategoryWithMenuIds(promotionMenuIds);

      const requiredPromotionMenu = promotionMenu.filter((promoMenu) => {
        const currentMenuId = promoMenu.menuId;
        const relatedAddonCatIds = menuAddonCategory
          .filter((item) => item.menuId === currentMenuId)
          .map((item) => item.addonCategoryId);
        const validAdddonCat = addonCategories
          ?.filter((item) => relatedAddonCatIds.includes(item.id))
          .filter((item) => item.isRequired);
        return validAdddonCat?.length;
      });

      //promotionMenu do not have required addon category
      const otherPormotionMenu = promotionMenu.filter(
        (item) =>
          !requiredPromotionMenu.map((item) => item.id).includes(item.id)
      );
      if (otherPormotionMenu.length) {
        const existingOtherPromotionMenu = otherPormotionMenu
          .map((item) => {
            const validExistCart = carts.find(
              (cart) => cart.menuId === item.menuId && cart.addons.length === 0
            );
            if (validExistCart) {
              return {
                id: validExistCart?.id || "",
                menuId: item.menuId,
                quantity: validExistCart?.quantity + item.quantity_required,
                addons: [],
              };
            }
          })
          .filter((item) => item !== undefined);
        if (existingOtherPromotionMenu.length) {
          // Update the carts state
          const updatedCarts = carts
            .filter(
              (cart) =>
                !otherPormotionMenu.some((item) => item.menuId === cart.menuId)
            )
            .concat(existingOtherPromotionMenu);

          // Assuming setCarts is the state setter function for carts
          setCarts(updatedCarts);
        }

        // new cart item not existed
        const newOtherPromotionMenu = otherPormotionMenu.filter(
          (item) =>
            !existingOtherPromotionMenu
              .map((exist) => exist.menuId)
              .includes(item.menuId)
        );

        const newCartItem: CartItem[] = newOtherPromotionMenu.map((item) => {
          return {
            id: generateNumericID(),
            menuId: item.menuId,
            addons: [],
            quantity: item.quantity_required,
          };
        });
        if (newCartItem.length) {
          if (newCartItem.length) {
            setCarts((prevCarts) => [...prevCarts, ...newCartItem]);
          }
        }
      }

      setCheckingRequiredAddonCat(false);

      if (requiredPromotionMenu.length) {
        updatedPromotionQue = [
          ...updatedPromotionQue,
          ...requiredPromotionMenu,
        ];
        setPromotionQue(updatedPromotionQue);
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
      onPress={handleGetPromotion}
      className="text-white bg-primary w-full"
      isDisabled={!promotionAvailabel || checkingRequiredAddonCat}
    >
      {checkingRequiredAddonCat ? (
        <>
          <span>Checking menu have require addon-category</span>
          <Spinner color="white" variant="wave" />
        </>
      ) : (
        "Get Promotion"
      )}
    </Button>
  );
}
