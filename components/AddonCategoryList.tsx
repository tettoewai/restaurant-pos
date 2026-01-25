"use client";

import { AddonCategory, Menu, MenuAddonCategory } from "@prisma/client";
import { useState } from "react";
import ItemCardClient from "./ItemCardClient";
import UpdateAddonCategoryDialog from "./UpdateAddonCategoryDailog";
import { useDisclosure } from "@heroui/react";
import { Suspense } from "react";
import { ItemCardSkeleton } from "@/app/ui/skeletons";

interface Props {
  addonCategories: AddonCategory[];
  menus: Menu[];
  menuAddonCategory: MenuAddonCategory[];
}

export default function AddonCategoryList({
  addonCategories,
  menus,
  menuAddonCategory,
}: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setSelectedId(id);
    onOpen();
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {addonCategories.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCardClient
              id={item.id}
              name={item.name}
              itemType="addonCategory"
              required={item.isRequired}
              onEditAddonCategory={handleEdit}
              menus={menus}
              menuAddonCategory={menuAddonCategory}
            />
          </Suspense>
        ))}
      </div>
      {selectedId !== null && (
        <UpdateAddonCategoryDialog
          key={selectedId}
          id={selectedId}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onClose={handleClose}
          menu={menus}
        />
      )}
    </>
  );
}
