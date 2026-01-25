"use client";

import { Location } from "@prisma/client";
import { useState } from "react";
import ItemCard from "./ItemCard";
import UpdateLocationDialog from "./UpdateLocationDailog";
import { useDisclosure } from "@heroui/react";
import { Suspense } from "react";
import { ItemCardSkeleton } from "@/app/ui/skeletons";

interface Props {
  locations: Location[];
  isSingleLocation: boolean;
}

export default function LocationList({
  locations,
  isSingleLocation,
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-2">
        {locations.map((item) => (
          <Suspense key={item.id} fallback={<ItemCardSkeleton />}>
            <ItemCard
              id={item.id}
              name={item.name}
              itemType="location"
              isNotDeletable={isSingleLocation}
              onEditLocation={handleEdit}
            />
          </Suspense>
        ))}
      </div>
      {selectedId !== null && (
        <UpdateLocationDialog
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
