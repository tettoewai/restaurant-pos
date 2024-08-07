import { fetchAddon } from "@/app/lib/data";
import MoreOptionButton from "@/components/MoreOptionButton";
import { Card } from "@nextui-org/react";
import { MdRestaurantMenu } from "react-icons/md";

const Addon = async () => {
  const addon = await fetchAddon();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Addon</span>
          <span className="text-sm text-gray-600">Manage your addon</span>
        </div>
        {/* <NewMenuCategoryButton /> */}
      </div>
      <div className="flex flex-wrap mt-2">
        {addon.map((item) => (
          <Card
            key={item.id}
            className="w-40 bg-background h-32 flex items-center m-1"
          >
            <div className="w-full h-7 flex justify-end pr-1 absolute top-2 right-1">
              <MoreOptionButton id={item.id} itemType="menuCategory" />
            </div>
            <MdRestaurantMenu className="size-8 mt-10 mb-1 text-primary" />
            <span className="text-center">{item.name}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Addon;
