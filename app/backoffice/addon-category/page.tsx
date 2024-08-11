import {
  fetchAddonCategory,
  fetchMenu,
  fetchMenuAddonCategory,
} from "@/app/lib/data";
import ItemCard from "@/components/ItemCard";
import NewAddonCategoryDialog from "@/components/NewAddonCategoryDailog";

const AddonCateogory = async () => {
  const addonCategory = await fetchAddonCategory();
  const menus = await fetchMenu();
  const menuAddonCategory = await fetchMenuAddonCategory();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon Category</span>
          <span className="text-sm text-gray-600">
            Manage your addon category
          </span>
        </div>
        <NewAddonCategoryDialog menus={menus} />
      </div>
      <div className="flex flex-wrap mt-2">
        {addonCategory.map((item) => (
          <ItemCard
            id={item.id}
            key={item.id}
            name={item.name}
            itemType="addonCategory"
            menus={menus}
            menuAddonCategory={menuAddonCategory}
            required={item.isRequired}
          />
        ))}
      </div>
    </div>
  );
};

export default AddonCateogory;