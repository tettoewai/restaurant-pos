"use client";
import { deletePurchaseOrder } from "@/app/lib/warehouse/action";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { PurchaseOrder } from "@prisma/client";
import { useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  purchaseOrder?: PurchaseOrder;
}

export default function DeletePurchaseOrderDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  purchaseOrder,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id)
      return addToast({ title: "Id was not provided.", color: "danger" });

    // Additional validation
    if (purchaseOrder?.status === "RECEIVED") {
      return addToast({
        title:
          "Cannot delete a received purchase order. Stock has already been updated.",
        color: "danger",
      });
    }

    if (purchaseOrder?.status === "CANCELLED") {
      return addToast({
        title: "Cannot delete a cancelled purchase order.",
        color: "danger",
      });
    }

    setIsLoading(true);
    const { isSuccess, message } = await deletePurchaseOrder(id);
    setIsLoading(false);

    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      onClose();
    }
  };

  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={!isLoading}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Delete Purchase Order | {purchaseOrder?.code}
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="space-y-2">
                <p>
                  Are you sure you want to delete this purchase order (
                  <span className="font-semibold">{purchaseOrder?.code}</span>)?
                </p>
                {purchaseOrder?.status === "PENDING" && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ This purchase order is still pending. This action cannot
                    be undone.
                  </p>
                )}
                {purchaseOrder?.status === "RECEIVED" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ Cannot delete received purchase orders as they have
                    already affected inventory.
                  </p>
                )}
                {purchaseOrder?.status === "CANCELLED" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ℹ️ This purchase order has been cancelled and cannot be
                    deleted.
                  </p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={onClose}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={
                  isLoading ||
                  purchaseOrder?.status === "RECEIVED" ||
                  purchaseOrder?.status === "CANCELLED"
                }
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {isLoading ? (
                  <Spinner color="white" variant="wave" />
                ) : (
                  "Delete"
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
