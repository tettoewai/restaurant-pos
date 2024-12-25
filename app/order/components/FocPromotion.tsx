"use client";
import { Button, Card, Checkbox, CheckboxGroup, cn } from "@nextui-org/react";
import { FocCategory, FocMenu, Menu } from "@prisma/client";
import React, { useState } from "react";
import Image from "next/image";
import UpdateMenuDialog from "@/components/UpdateMenuDailog";

function FocPromotion({
  focPromotions,
  focData,
  allMenus,
}: {
  focPromotions: unknown[];
  focData: {
    focCategory: FocCategory[];
    focMenu: FocMenu[];
  };
  allMenus: Menu[];
}) {
  const [selectedFocMenu, setSelectedFocMenu] = useState<
    { promotionId: number; focId: number; menuId: string[] }[]
  >([]);

  return (
    <div className="mt-2">
      <h1>Congratulation ! You got FOC Promotion(s)</h1>
      <div className="mt-2 space-y-1">
        {focPromotions.map((item: any) => {
          const validFocCat = focData.focCategory.filter(
            (focCat) => focCat.promotionId === item.id
          );
          const validFocMenu = focData.focMenu.filter((menu) =>
            validFocCat.map((focCat) => focCat.id).includes(menu.focCategoryId)
          );
          return (
            <Card key={item.id} className="border-1 border-primary p-2">
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
                                  className="p-2 border-1"
                                  shadow="none"
                                >
                                  <Checkbox
                                    classNames={{
                                      base: cn("w-full max-w-md"),
                                      wrapper: cn("absolute right-0"),
                                    }}
                                    value={String(menu.id)}
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
                <Button>No Thanks!</Button>
                <Button
                  color="primary"
                  onClick={() => {
                    console.log(
                      selectedFocMenu.filter(
                        (selectedFoc) =>
                          selectedFoc.menuId.length &&
                          selectedFoc.promotionId === item.id
                      )
                    );
                  }}
                >
                  Get Promotion
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
