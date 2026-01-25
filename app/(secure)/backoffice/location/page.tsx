import { fetchLocation } from "@/app/lib/backoffice/data";
import LocationList from "@/components/LocationList";
import NewLocationDialog from "@/components/NewLocationDailog";
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
      <LocationList
        locations={location}
        isSingleLocation={isSingleLocation}
      />
    </div>
  );
}
