import {
  fetchAddon,
  fetchAddonCategory,
  fetchMenuAddonCategory,
  fetchMenuWithId,
} from "@/app/lib/data";
import { Card, Textarea } from "@nextui-org/react";
import Image from "next/image";
import AddToCardBut from "../components/AddToCardBut";
import AddonCategoryCard from "../components/AddonCategory";

export default async function MenuPage({ params }: { params: { id: string } }) {
  const menuId = Number(params.id);
  const [menu, menuAddonCategory, addonCategory, addon] = await Promise.all([
    fetchMenuWithId(menuId),
    fetchMenuAddonCategory(),
    fetchAddonCategory(),
    fetchAddon(),
  ]);
  const validAddonCat = menuAddonCategory
    .filter((item) => item.menuId === menuId)
    .map((menuAddonCat) => menuAddonCat.addonCategoryId);
  const validAddonCategory = addonCategory.filter((item) =>
    validAddonCat.includes(item.id)
  );
  return (
    <div className="w-full h-screen">
      <div className="pb-24">
        <Card className="mb-5 max-h-80">
          <div className="overflow-hidden rounded-md w-full object-contain">
            <Image
              src={menu?.assetUrl || "/default-menu.png"}
              alt="menu-image"
              width={1080}
              height={1080}
              className="h-full w-full"
            />
          </div>
          <div className="mt-2 flex flex-col mb-2 ml-2">
            <h2 className="text-primary text-lg">{menu?.name}</h2>
            <span>{menu?.description}</span>
            <span className="text-lg mt-2">{menu?.price} Kyats</span>
          </div>
        </Card>
        <div className="space-y-2">
          {validAddonCategory.map((item) => {
            const validAddon = addon.filter(
              (addon) => addon.addonCategoryId === item.id
            );
            return (
              <AddonCategoryCard
                key={item.id}
                item={item}
                validAddon={validAddon}
              />
            );
          })}
        </div>
        <Card className="mt-5 bg-background p-2">
          <span>Special instructions</span>
          <Textarea
            variant="faded"
            color="secondary"
            fullWidth
            placeholder="e.g. No mayo"
          />
        </Card>
      </div>
      <AddToCardBut />
    </div>
  );
}
