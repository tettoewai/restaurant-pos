import { Card } from "@nextui-org/react";
import Image from "next/image";
import MenuForm from "../components/MenuForm";
import {
  fetchMenuWithId,
  fetchMenuAddonCategory,
  fetchAddonCategory,
  fetchAddon,
} from "@/app/lib/backoffice/data";

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
    <div>
      <div className="pb-24">
        <Card className="mb-5 max-h-80">
          <div className="flex justify-center items-center overflow-hidden rounded-md w-full object-contain">
            <Image
              src={menu?.assetUrl || "/default-menu.png"}
              alt="menu-image"
              width={1080}
              height={1080}
              className="h-full w-full"
              priority
            />
          </div>
          <div className="mt-2 flex flex-col mb-2 ml-2">
            <h2 className="text-primary text-lg">{menu?.name}</h2>
            <span className="text-sm">{menu?.description}</span>
            <span className="text-lg mt-2">{menu?.price} Kyats</span>
          </div>
        </Card>
        <MenuForm
          addon={addon}
          addonCategory={validAddonCategory}
          menuId={menuId}
        />
      </div>
    </div>
  );
}
