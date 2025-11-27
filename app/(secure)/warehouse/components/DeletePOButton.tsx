"use client";

import DeletePurchaseOrderDialog from "./DeletePurchaseOrderDialog";
import { Button } from "@heroui/react";
import { PurchaseOrder } from "@prisma/client";
import { TrashBinMinimalistic } from "@solar-icons/react/ssr";
import { useState } from "react";

export default function DeletePOButton({ item }: { item: PurchaseOrder }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        color="danger"
        onPress={() => setIsOpen(true)}
      >
        <TrashBinMinimalistic className="size-5" />
      </Button>
      <DeletePurchaseOrderDialog
        id={item.id}
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        onClose={() => setIsOpen(false)}
        purchaseOrder={item}
      />
    </>
  );
}
