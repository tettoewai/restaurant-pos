import { fetchAddon, fetchAddonCategory } from "@/app/lib/data";
import ItemCard from "@/components/ItemCard";
import NewAddonDialog from "@/components/NewAddonDailog";

const Addon = async () => {
  const addon = await fetchAddon();
  const addonCategory = await fetchAddonCategory();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon</span>
          <span className="text-sm text-gray-600">Manage your addon</span>
        </div>
        <NewAddonDialog addonCategory={addonCategory} />
      </div>
      <div className="flex flex-wrap mt-2">
        {addon.map((addon) => (
          <ItemCard
            itemType="addon"
            id={addon.id}
            key={addon.id}
            name={addon.name}
            addonCategoryId={addon.addonCategoryId}
            addonCategory={addonCategory}
          />
        ))}
      </div>
    </div>
  );
};

export default Addon;
