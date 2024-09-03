import { fetchLocation } from "@/app/lib/backoffice/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import NewLocationDialog from "@/components/NewLocationDailog";
import { Suspense } from "react";

export default async function Location() {
  const location = await fetchLocation();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Location</span>
          <span className="text-sm text-gray-600">Manage your Locations</span>
        </div>
        <NewLocationDialog />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 mt-2">
        {location.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard id={item.id} name={item.name} itemType="location" />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
