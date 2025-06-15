"use client";

import { updateWarehouse } from "@/app/lib/warehouse/action";
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { Warehouse } from "@prisma/client";
import { useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  warehouse?: Warehouse;
}

export default function UpdateWarehouseDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  warehouse,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const name = formData.get("name");
    if (!id || !name)
      return addToast({ color: "danger", title: "Missing required fields!" });
    const { isSuccess, message } = await updateWarehouse(formData);
    setIsSubmitting(false);
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
            Update Warehouse
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Input
                name="name"
                label="Name"
                variant="bordered"
                defaultValue={warehouse?.name || ""}
                required
                isRequired
              />
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? <Spinner color="white" /> : <span>Update</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
