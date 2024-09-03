import { fetchAddon, fetchAddonCategory } from "@/app/lib/backoffice/data";
import { ItemCardSkeleton } from "@/app/ui/skeletons";
import ItemCard from "@/components/ItemCard";
import NewAddonDialog from "@/components/NewAddonDailog";
import { Suspense } from "react";

const Addon = async () => {
  const [addon, addonCategory] = await Promise.all([
    fetchAddon(),
    fetchAddonCategory(),
  ]);
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon</span>
          <span className="text-sm text-gray-600">Manage your addon</span>
        </div>
        <NewAddonDialog addonCategory={addonCategory} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 mt-2">
        {addon.map((addon) => (
          <Suspense key={addon.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              itemType="addon"
              id={addon.id}
              name={addon.name}
              addonCategoryId={addon.addonCategoryId}
              price={addon.price}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
};

export default Addon;
