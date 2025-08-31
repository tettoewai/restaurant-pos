import { fetchWarehouse } from "@/app/lib/warehouse/data";
import NewWarehouseDailog from "../components/NewWarehouseDialog";
import ItemCard from "@/components/ItemCard";
import { Suspense } from "react";
import { ItemCardSkeleton } from "@/app/ui/skeletons";

export default async function WarehouseManagePage() {
  const warehouse = await fetchWarehouse();
  if (warehouse && !warehouse.length)
    return (
      <div>
        <span>There is no warehouse.</span>
      </div>
    );
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Warehouse Management</span>
          <span className="text-sm text-gray-600">
            Multiple warehouses for more storage.
          </span>
        </div>
        <NewWarehouseDailog />
      </div>
      <div className="flex space-x-1 space-y-1 w-full">
        {warehouse?.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              itemType="warehouse"
              id={item.id}
              name={item.name}
              warehouse={item}
              isNotDeletable={Boolean(warehouse.length < 2)}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
