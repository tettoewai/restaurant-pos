"use client";
import {
  fetchAddonCategoryWithIds,
  fetchFocMenuAddonCategoryWithPromotionIdAndMenuIds,
  fetchPromotionWithId,
} from "@/app/lib/backoffice/data";
import { createFocOrder } from "@/app/lib/order/action";
import { fetchAddonCategoryMenuWithMenuIds } from "@/app/lib/order/data";
import { checkPromotionDuration } from "@/function";
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  cn,
  Spinner,
} from "@heroui/react";
import { FocCategory, FocMenu, Menu } from "@prisma/client";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { mutate } from "swr";

function FocPromotion({
  focPromotions,
  focData,
  allMenus,
  tableId,
}: {
  focPromotions: unknown[];
  focData: {
    focCategory: FocCategory[];
    focMenu: FocMenu[];
  };
  allMenus: Menu[];
  tableId: number;
}) {
  const [selectedFocMenu, setSelectedFocMenu] = useState<
    { promotionId: number; focId: number; menuId: string[] }[]
  >([]);
  const [isGettingPromo, setIsGettingPromo] = useState<{
    loading: boolean;
    promotionId: number;
  } | null>();
  const handleGetPromotion = async (menuIds: number[], promotionId: number) => {
    setIsGettingPromo({ loading: true, promotionId });
    const promotion = await fetchPromotionWithId(promotionId);
    const conditions =
      promotion?.conditions && JSON.parse(promotion.conditions.toString());
    const days: string =
      conditions &&
      conditions.length &&
      conditions
        .map((item: any) => (item.days ? item.days : []))
        .filter((item: any) => item !== undefined)
        .join(", ");
    const promotionAvailabel = checkPromotionDuration({ days, conditions });
    if (!promotionAvailabel)
      return toast.error("This promotion is not available now!");
    if (!focData) return toast.error("There is no foc promotion!");
    const menuAddonCategory = await fetchAddonCategoryMenuWithMenuIds(menuIds);
    const addonCatIds = menuAddonCategory.reduce((acc: number[], item) => {
      if (!acc.includes(item.addonCategoryId)) {
        acc.push(item.addonCategoryId);
      }
      return acc;
    }, []);
    const addonCategory = await fetchAddonCategoryWithIds(addonCatIds);
    const requiredAddonCatMenu = menuIds.filter((item) => {
      const currentMenuAddonCatIds = menuAddonCategory
        .filter((menuAddonCat) => menuAddonCat.menuId === item)
        .map((menuAddonCat) => menuAddonCat.addonCategoryId);
      const requiredCurrentAddonCat = addonCategory?.filter(
        (addonCat) =>
          currentMenuAddonCatIds.includes(addonCat.id) && addonCat.isRequired
      );
      return requiredCurrentAddonCat?.length;
    });
    if (menuIds.length) {
      const numbers = "0123456789";
      const generateNumericID = customAlphabet(numbers, 7);
      const focMenuAddonCategory =
        await fetchFocMenuAddonCategoryWithPromotionIdAndMenuIds({
          promotionId,
          menuIds: requiredAddonCatMenu,
        });
      const focOrderWithAddon = menuIds.map((item) => {
        const validAddons = focMenuAddonCategory
          .filter(
            (requiredAddonCatMenu) =>
              requiredAddonCatMenu.menuId === item &&
              promotionId === requiredAddonCatMenu.promotionId
          )
          .map((requiredAddonCatMenu) => requiredAddonCatMenu.addonId);
        return {
          id: generateNumericID(),
          menuId: item,
          addons: validAddons || [],
          isFoc: true,
          quantity: 1,
        };
      });
      const { isSuccess, message } = await createFocOrder({
        tableId,
        cartItem: focOrderWithAddon,
        promotionId,
      });
      if (isSuccess) {
        toast.success(message);
        mutate("promotionUsage");
      } else {
        toast.error(message);
      }
    }
    setIsGettingPromo(null);
  };

  return (
    <div className="pt-2">
      <h1>Congratulation ! You got FOC Promotion(s)</h1>
      <div className="mt-2 space-y-1">
        {focPromotions.map((item: any) => {
          const validFocCat = focData.focCategory.filter(
            (focCat) => focCat.promotionId === item.id
          );
          const validFocMenu = focData.focMenu.filter((menu) =>
            validFocCat.map((focCat) => focCat.id).includes(menu.focCategoryId)
          );

          const preferFocMenu = selectedFocMenu.filter(
            (selectedFoc) =>
              selectedFoc.menuId.length && selectedFoc.promotionId === item.id
          );
          const menuIds = preferFocMenu
            .map((item) => item.menuId)
            .reduce((acc: number[], id) => {
              id.map((item) => {
                if (!acc.includes(Number(item))) {
                  acc.push(Number(item));
                }
              });
              return acc;
            }, []);
          return (
            <Card
              key={item.id}
              className="border-1 border-primary p-2 bg-background"
            >
              <div className="w-16 h-16 -scale-x-100 absolute right-0 top-0">
                <Image
                  src="/ribbon_cornor.png"
                  alt="ribbon cornor"
                  width={1080}
                  height={1080}
                  className="w-full h-full"
                />
              </div>
              <h2 className="font-bold">{item.name}</h2>
              {validFocCat.map((foc) => {
                const currentMenuFoc = validFocMenu.filter(
                  (focMenu) => focMenu.focCategoryId === foc.id
                );
                const otherSelectedFoc = selectedFocMenu.filter(
                  (selected) => selected.focId !== foc.id
                );
                const currentSelectedFoc = selectedFocMenu.find(
                  (selected) => selected.focId === foc.id
                );
                return (
                  <div key={foc.id}>
                    {currentMenuFoc.length && (
                      <div>
                        <div className="flex flex-col p-2 space-y-1">
                          <CheckboxGroup
                            value={currentSelectedFoc?.menuId || []}
                            onValueChange={(e) => {
                              const updateSelectedMenu = {
                                promotionId: item.id as number,
                                focId: foc.id,
                                menuId: e,
                              };
                              if (
                                updateSelectedMenu.menuId.length <=
                                foc.minSelection
                              ) {
                                setSelectedFocMenu([
                                  ...otherSelectedFoc,
                                  updateSelectedMenu,
                                ]);
                              }
                            }}
                            label={`You can select ${
                              currentMenuFoc.length > 1
                                ? `${foc.minSelection} of`
                                : ""
                            } following menu${
                              currentMenuFoc.length > 1 ? `(s)` : ""
                            } if you prefer.`}
                          >
                            {currentMenuFoc.map((menu) => {
                              const validMenu = allMenus?.find(
                                (focMenu) => focMenu.id === menu.menuId
                              );
                              return (
                                <Card
                                  key={menu.id}
                                  className="p-2 border-1 bg-background"
                                  shadow="none"
                                >
                                  <Checkbox
                                    classNames={{
                                      base: cn("w-full max-w-md"),
                                      wrapper: cn("absolute right-0"),
                                    }}
                                    value={String(menu.menuId)}
                                  >
                                    <div className="flex w-full">
                                      <div className="w-14 h-full flex items-center justify-center">
                                        <Image
                                          src={
                                            validMenu?.assetUrl ||
                                            "/default-menu.png"
                                          }
                                          alt="menu"
                                          width={500}
                                          height={500}
                                          className="w-full h-auto object-contain"
                                        />
                                      </div>
                                      <div className="ml-2">
                                        <h1 className="font-bold">
                                          {validMenu?.name}
                                        </h1>
                                        <span className="text-default-500">
                                          {validMenu?.description}
                                        </span>
                                      </div>
                                    </div>
                                  </Checkbox>
                                </Card>
                              );
                            })}
                          </CheckboxGroup>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="w-full flex justify-end space-x-1">
                <Button
                  isDisabled={
                    Boolean(!menuIds.length) ||
                    (isGettingPromo?.promotionId === item.id &&
                      isGettingPromo?.loading)
                  }
                  color="primary"
                  onPress={() => handleGetPromotion(menuIds, item.id)}
                >
                  {isGettingPromo?.promotionId === item.id &&
                  isGettingPromo?.loading ? (
                    <Spinner color="white" />
                  ) : (
                    "Get Promotion"
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default FocPromotion;
