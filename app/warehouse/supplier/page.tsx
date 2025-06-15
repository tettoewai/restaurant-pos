export const revalidate = 3600;

import { fetchSupplier } from "@/app/lib/warehouse/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import { Suspense } from "react";
import NewSupplierDailog from "../components/NewSupplierDialog";

export default async function SupplierPage() {
  const supplier = await fetchSupplier();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Supplier</span>
          <span className="text-sm text-gray-600">Manage supplier</span>
        </div>
        <NewSupplierDailog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-5">
        {supplier.length > 0 ? (
          supplier.map((item) => (
            <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
              <ItemCard
                itemType="supplier"
                id={item.id}
                name={item.name}
                supplier={item}
              />
            </Suspense>
          ))
        ) : (
          <span>There is no supplier.</span>
        )}
      </div>
    </div>
  );
}
