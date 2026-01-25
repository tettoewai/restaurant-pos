"use client";

import { Addon, AddonCategory } from "@prisma/client";
import { useState } from "react";
import ItemCard from "./ItemCard";
import UpdateAddonDialog from "./UpdateAddonDailog";
import { useDisclosure } from "@heroui/react";
import { Suspense } from "react";
import { ItemCardSkeleton } from "@/app/ui/skeletons";

interface Props {
  addons: Addon[];
  addonCategory: AddonCategory[];
}

export default function AddonList({ addons, addonCategory }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedAddon, setSelectedAddon] = useState<{
    id: number;
    addon?: Addon;
  } | null>(null);

  const handleEdit = (id: number, addon: Addon) => {
    setSelectedAddon({ id, addon });
    onOpen();
  };

  const handleClose = () => {
    setSelectedAddon(null);
    onClose();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {addons.map((addon) => (
          <Suspense key={addon.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              itemType="addon"
              id={addon.id}
              addon={addon}
              name={addon.name}
              addonCategoryId={addon.addonCategoryId}
              price={addon.price}
              onEditAddon={handleEdit}
            />
          </Suspense>
        ))}
      </div>
      {selectedAddon && (
        <UpdateAddonDialog
          key={selectedAddon.id}
          id={selectedAddon.id}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onClose={handleClose}
          addonCategory={addonCategory}
          addon={selectedAddon.addon}
        />
      )}
    </>
  );
}
