import {
  fetchSelectedWarehouse,
  fetchWarehouse,
  fetchWarehouseItemWithIds,
  fetchWarehouseStock,
} from "@/app/lib/warehouse/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import { NewPOButton } from "@/components/Buttons";
import ItemCard from "@/components/ItemCard";
import { captilize, convertUnit, roundToTwoDecimal } from "@/function";
import { Card } from "@heroui/react";
import { Suspense } from "react";
import { LiaWarehouseSolid } from "react-icons/lia";
import WarehouseToggle from "../components/WarehouseToggle";

export const revalidate = 60;

export default async function StockPage() {
  const warehouseStock = await fetchWarehouseStock();
  const warehouseItems = await fetchWarehouseItemWithIds(
    warehouseStock.map((item) => item.itemId)
  );
  const [warehouse, selectedWarehouse] = await Promise.all([
    fetchWarehouse(),
    fetchSelectedWarehouse(),
  ]);

  if (!warehouse || !warehouse.length || !selectedWarehouse)
    return <span>There is no warehouse.</span>;
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Warehouse Stock</span>
          <span className="text-sm text-gray-600">
            Real-time warehouse stock.
          </span>
        </div>
        <NewPOButton />
      </div>
      <div className="mt-5">
        <Card
          fullWidth
          className="flex justify-between flex-row items-center p-2 bg-background h-14 pr-4"
        >
          <div className="flex">
            <LiaWarehouseSolid className="size-6 text-primary mr-2 items-center justify-center" />
            <span>Warehouse</span>
          </div>
          <WarehouseToggle
            warehouse={warehouse}
            selectedWarehouse={selectedWarehouse}
          />
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mt-5">
        {warehouseStock && warehouseStock.length ? (
          warehouseStock.map((item) => {
            const currentWarehouseItem = warehouseItems.find(
              (wi) => wi.id === item.itemId
            );
            const quantity = currentWarehouseItem
              ? `${roundToTwoDecimal(
                  convertUnit({
                    amount: item.quantity,
                    toUnit: currentWarehouseItem?.unit,
                  })
                )} ${captilize(currentWarehouseItem.unit)}`
              : "";
            const isActive = currentWarehouseItem
              ? item.quantity <= currentWarehouseItem?.threshold
              : false;
            return (
              <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
                <ItemCard
                  itemType="warehouseStock"
                  id={item.id}
                  name={currentWarehouseItem?.name || ""}
                  quantity={quantity}
                  isActive={isActive}
                />
              </Suspense>
            );
          })
        ) : (
          <span>There is no warehouse stock.</span>
        )}
      </div>
    </div>
  );
}
