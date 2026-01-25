import { fetchAddon, fetchAddonCategory } from "@/app/lib/backoffice/data";
import AddonList from "@/components/AddonList";
import NewAddonDialog from "@/components/NewAddonDailog";
import { baseMetadata } from "@/app/lib/baseMetadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Addon | ${baseMetadata.title}`,
};

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
      <AddonList addons={addon} addonCategory={addonCategory} />
    </div>
  );
};

export default Addon;
