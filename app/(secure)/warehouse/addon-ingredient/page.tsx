export const revalidate = 3600;

import {
  fetchAddon,
  fetchAddonCategory,
  fetchMenu,
} from "@/app/lib/backoffice/data";
import {
  fetchAddonIngredients,
  fetchWarehouseItem,
} from "@/app/lib/warehouse/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import MoreOptionButton from "@/components/MoreOptionButton";
import NewAddonIngredientDialog from "@/components/NewAddonIngredient";
import { captilize, convertUnit } from "@/function";
import { Card } from "@heroui/react";
import { WidgetAdd } from "@solar-icons/react/ssr";
import { HandPlatter } from "lucide-react";
import { Suspense } from "react";

export interface AddonIngredientDataType {
  menuId: number;
  addonId: number;
  ingredients: {
    itemId: number;
    extraQty: number;
  }[];
}

export default async function AddonIngredientPage() {
  const addonIngredients = await fetchAddonIngredients();

  const [addons, warehouseItems, menus, addonCategories] = await Promise.all([
    fetchAddon(),
    fetchWarehouseItem(),
    fetchMenu(),
    fetchAddonCategory(),
  ]);

  // Assuming addonIngredients is your raw data with repeated menuId & addonId
  const groupedDataMap = new Map<string, AddonIngredientDataType>();

  addonIngredients.forEach((cur) => {
    const key = `${cur.menuId}-${cur.addonId}`;
    const ingredient = {
      itemId: cur.itemId,
      extraQty: cur.extraQty,
    };

    if (groupedDataMap.has(key)) {
      groupedDataMap.get(key)!.ingredients.push(ingredient);
    } else {
      groupedDataMap.set(key, {
        menuId: cur.menuId || 0,
        addonId: cur.addonId,
        ingredients: [ingredient],
      });
    }
  });

  const addonIngredientData: AddonIngredientDataType[] = Array.from(
    groupedDataMap.values()
  );

  if (!addons || !addons.length) return <span>There is no add-on.</span>;
  if (!warehouseItems || !warehouseItems.length)
    return <span>There is no warehouse item.</span>;

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon Ingredient</span>
          <span className="text-sm text-gray-600">
            Set addon ingredient for smart cook.
          </span>
        </div>
        <NewAddonIngredientDialog
          addons={addons}
          warehouseItems={warehouseItems}
          menus={menus}
          addonIngredients={addonIngredients}
          addonCategories={addonCategories}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
        {addonIngredientData.map((ingredient, index) => {
          const currentAddon = addons.find(
            (item) => item.id === ingredient.addonId
          );
          const currentMenu = menus.find(
            (item) => item.id === ingredient.menuId
          );
          return (
            <Suspense key={index} fallback={<ItemCardSkeleton />}>
              <Card className="break-inside-avoid h-fit p-4 bg-background flex items-center flex-col relative">
                <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
                  <MoreOptionButton
                    id={index}
                    itemType="addonIngredient"
                    addons={addons}
                    warehouseItems={warehouseItems}
                    menus={menus}
                    addonIngredientData={ingredient}
                    addonIngredients={addonIngredients}
                    menu={currentMenu}
                    addon={currentAddon}
                  />
                </div>
                <div className="flex space-x-4 mt-3">
                  <WidgetAdd
                    strokeWidth={1}
                    size={28}
                    className="text-primary"
                  />
                  <HandPlatter
                    strokeWidth={1.3}
                    size={28}
                    className="text-primary"
                  />
                </div>
                <div className="flex space-x-4 text-sm mt-2 w-full">
                  <p className="truncate w-full">{currentAddon?.name}</p>
                  <p className="truncate w-full">
                    {currentMenu?.name || "(All)"}
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  {ingredient.ingredients.map((item, index1) => {
                    const currentItem = warehouseItems.find(
                      (wi) => wi.id === item.itemId
                    );
                    if (!currentItem)
                      return <span key={"none"}>There is no item</span>;
                    return (
                      <div
                        key={index1}
                        className="flex justify-between items-center space-x-4"
                      >
                        <p>{currentItem.name}</p>
                        <p>
                          {convertUnit({
                            amount: item.extraQty,
                            toUnit: currentItem.unit,
                          })}{" "}
                          {captilize(currentItem.unit)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Suspense>
          );
        })}
      </div>
    </div>
  );
}
