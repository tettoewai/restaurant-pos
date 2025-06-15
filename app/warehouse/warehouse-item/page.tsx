import { fetchWarehouseItem } from "@/app/lib/warehouse/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import { Suspense } from "react";
import NewWarehouseItemDialog from "../components/NewWarehouseItemDialog";

export const revalidate = 60;

export default async function WarehouseItemPage() {
  const warehouseItem = await fetchWarehouseItem();

  if (!warehouseItem || !warehouseItem.length)
    return <span>There is no warehouse item</span>;
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Warehouse Item</span>
          <span className="text-sm text-gray-600">Manage waerhouse item</span>
        </div>
        <NewWarehouseItemDialog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-5">
        {warehouseItem.length > 0 ? (
          warehouseItem.map((item) => (
            <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
              <ItemCard
                itemType="warehouseItem"
                id={item.id}
                name={item.name}
                warehouseItem={item}
              />
            </Suspense>
          ))
        ) : (
          <span>There is no item.</span>
        )}
      </div>
    </div>
  );
}
