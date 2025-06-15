export const revalidate = 3600;

import { fetchAddon, fetchMenu } from "@/app/lib/backoffice/data";
import {
  fetchAddonIngredients,
  fetchWarehouseItem,
} from "@/app/lib/warehouse/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import MoreOptionButton from "@/components/MoreOptionButton";
import NewAddonIngredientDialog from "@/components/NewAddonIngredient";
import { captilize, convertUnit } from "@/function";
import { Suspense } from "react";
import { BiFoodMenu } from "react-icons/bi";
import { MdRestaurantMenu } from "react-icons/md";

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

  const [addons, warehouseItems, menus] = await Promise.all([
    fetchAddon(),
    fetchWarehouseItem(),
    fetchMenu(),
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
        />
      </div>

      <div className="mt-5 columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
        {addonIngredientData.map((ingredient, index) => {
          const currentAddon = addons.find(
            (item) => item.id === ingredient.addonId
          );
          const currentMenu = menus.find(
            (item) => item.id === ingredient.menuId
          );
          return (
            <Suspense key={index} fallback={<ItemCardSkeleton />}>
              <div className="break-inside-avoid  p-1 py-3 h-fit bg-background rounded-md flex items-center flex-col relative">
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
                  <MdRestaurantMenu className="size-8 text-primary" />
                  <BiFoodMenu className="size-8 text-primary" />
                </div>
                <div className="flex space-x-4 text-sm mt-2">
                  <p className="truncate">{currentAddon?.name}</p>
                  <p className="truncate">{currentMenu?.name || "(All)"}</p>
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
              </div>
            </Suspense>
          );
        })}
      </div>
    </div>
  );
}
