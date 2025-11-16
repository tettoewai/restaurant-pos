"use client";
import { deleteSupplier } from "@/app/lib/warehouse/action";
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
import { Supplier } from "@prisma/client";
import { useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  supplier?: Supplier;
}

export default function DeleteSupplierDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  supplier,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id)
      return addToast({ title: "Id was not provided.", color: "danger" });
    setIsLoading(true);
    const { isSuccess, message } = await deleteSupplier(id);
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
        isDismissable={false}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Delete Supplier | {supplier?.name}
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <span>
                Are you sure you went to delete this supplier({supplier?.name}
                )?
              </span>
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={isLoading}
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
