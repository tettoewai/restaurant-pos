import { fetchLocation } from "@/app/lib/backoffice/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import NewLocationDialog from "@/components/NewLocationDailog";
import { Suspense } from "react";
import { baseMetadata } from "@/app/lib/baseMetadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Location | ${baseMetadata.title}`,
};

export default async function Location() {
  const location = await fetchLocation();
  const isSingleLocation = location.length === 1;
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Location</span>
          <span className="text-sm text-gray-600">Manage your Locations</span>
        </div>
        <NewLocationDialog />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-2">
        {location.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              id={item.id}
              name={item.name}
              itemType="location"
              isNotDeletable={isSingleLocation}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
