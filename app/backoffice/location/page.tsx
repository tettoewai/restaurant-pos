import { fetchLocation } from "@/app/lib/data";
import ItemCard from "@/components/ItemCard";
import NewLocationDialog from "@/components/NewLocationDailog";

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
      <div className="flex flex-wrap mt-2">
        {location.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            itemType="location"
            location={location}
          />
        ))}
      </div>
    </div>
  );
}
