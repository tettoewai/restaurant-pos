"use client";

import { MenuCategory, DisabledLocationMenuCategory } from "@prisma/client";
import { useState } from "react";
import ItemCardClient from "./ItemCardClient";
import UpdateMenuCategoryDialog from "./UpdateMenuCategoryDailog";
import { useDisclosure } from "@heroui/react";
import { Suspense } from "react";
import { ItemCardSkeleton } from "@/app/ui/skeletons";

interface Props {
  menuCategories: MenuCategory[];
  disableLocationMenuCategory: DisabledLocationMenuCategory[];
}

export default function MenuCategoryList({
  menuCategories,
  disableLocationMenuCategory,
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {menuCategories.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCardClient
              itemType="menuCategory"
              id={item.id}
              name={item.name}
              disableLocationMenuCategory={disableLocationMenuCategory}
              onEditMenuCategory={handleEdit}
            />
          </Suspense>
        ))}
      </div>
      {selectedId !== null && (
        <UpdateMenuCategoryDialog
          key={selectedId}
          id={selectedId}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onClose={handleClose}
        />
      )}
    </>
  );
}
