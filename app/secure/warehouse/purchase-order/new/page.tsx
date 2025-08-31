import {
  fetchSupplier,
  fetchWarehouse,
  fetchWarehouseItem,
} from "@/app/lib/warehouse/data";
import { Suspense } from "react";
import NewPurchaseOrderForm from "../../components/NewPurchaseOrderForm";
import { Spinner } from "@heroui/react";

export interface POItemForm {
  id: number;
  itemId: number;
  quantity: number | undefined;
  unit: string;
  price: number | undefined;
}

export default async function PurchaseOrderNew() {
  const suppliersPromise = fetchSupplier();
  const warehousesPromise = fetchWarehouse();
  const warehousesItemPromise = fetchWarehouseItem();

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">New Purchase Order(PO)</span>
          <span className="text-sm text-gray-600">
            Crate new your purchase order(PO).
          </span>
        </div>
      </div>
      <Suspense
        fallback={
          <Spinner
            variant="wave"
            label="Loading suppliers, warehouses and items ..."
            size="sm"
          />
        }
      >
        <NewPurchaseOrderForm
          suppliers={await suppliersPromise}
          warehouses={await warehousesPromise}
          warehouseItems={await warehousesItemPromise}
        />
      </Suspense>
    </div>
  );
}
