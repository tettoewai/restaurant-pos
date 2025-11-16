import { fetchMenu } from "@/app/lib/backoffice/data";
import {
  fetchMenuItemIngredientWithMenuIds,
  fetchWarehouseItem,
} from "@/app/lib/warehouse/data";
import MoreOptionButton from "@/components/MoreOptionButton";
import { captilize, convertUnit, roundToTwoDecimal } from "@/function";
import { Card } from "@heroui/react";
import { DangerTriangle } from "@solar-icons/react/ssr";
import Image from "next/image";

export default async function ItemIngredientPage() {
  const menus = await fetchMenu();
  const menuIds = menus.map((item) => item.id);
  const menuItemIngredient = await fetchMenuItemIngredientWithMenuIds(menuIds);
  const warehouseItems = await fetchWarehouseItem();

  if (
    !menuItemIngredient ||
    !menuItemIngredient.length ||
    !warehouseItems ||
    !warehouseItems.length
  )
    return <h1>There is no data.</h1>;

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Menu Ingredient</span>
        <span className="text-sm text-gray-600">
          Set menu ingredient for smart cook.
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
        {menus.map((menu) => {
          const currentIngredients = menuItemIngredient.filter(
            (item) => item.menuId === menu.id
          );
          return (
            <Card
              className="p-4 bg-background m-1 break-inside-avoid"
              key={menu.id}
            >
              <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
                <MoreOptionButton
                  id={menu.id}
                  itemType="ingredient"
                  menu={menu}
                  ingredients={currentIngredients}
                  warehouseItems={warehouseItems}
                />
              </div>
              <div className="overflow-hidden">
                <Image
                  src={menu.assetUrl || "/default-menu.png"}
                  alt="menu"
                  width={1080}
                  height={1080}
                  className="w-full h-40 object-cover rounded-md"
                />
              </div>
              <div className="w-full flex items-center justify-center font-semibold mt-2">
                <h1>{menu.name}</h1>
              </div>
              <div className="space-y-1 mt-1">
                {currentIngredients.length > 0 ? (
                  currentIngredients.map((ingredient) => {
                    const currentItem = warehouseItems.find(
                      (item) => item.id === ingredient.itemId
                    );
                    if (!currentItem)
                      return <span key="noItem">There is no item.</span>;
                    return (
                      <div key={ingredient.id} className="flex justify-between">
                        <h2>{currentItem?.name}</h2>
                        <div className="flex space-x-1">
                          <h2>
                            {roundToTwoDecimal(
                              convertUnit({
                                amount: ingredient.quantity,
                                toUnit: currentItem.unit,
                              })
                            )}
                          </h2>
                          <span>{captilize(currentItem.unit)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex justify-center items-center h-full mt-2 text-warning-500">
                    <DangerTriangle className="size-14" />
                    <span className="text-center">
                      Ingredients are not set yet.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
