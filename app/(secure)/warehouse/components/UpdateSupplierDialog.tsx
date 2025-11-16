"use client";

import { updateSupplier } from "@/app/lib/warehouse/action";
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
import { Supplier } from "@prisma/client";
import { useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  supplier?: Supplier;
}

export default function UpdateSupplierDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  supplier,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting === true) return;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const name = formData.get("name");
    const phoneNo = formData.get("phoneNo");
    const email = formData.get("email");
    const address = formData.get("address");
    if (!id || !name)
      return addToast({ color: "danger", title: "Missing required fields!" });
    const nothingChange =
      name === supplier?.name &&
      phoneNo === supplier.phone &&
      email === supplier.email &&
      address === supplier.address;
    if (nothingChange) return onClose();
    setIsSubmitting(true);
    const { isSuccess, message } = await updateSupplier(formData);
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
            Update Supplier
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Input
                name="name"
                label="Name"
                variant="bordered"
                defaultValue={supplier?.name || ""}
                required
                isRequired
              />
              <Input
                name="phoneNo"
                defaultValue={supplier?.phone || ""}
                label="Phone no"
                variant="bordered"
              />
              <Input
                name="email"
                label="email"
                variant="bordered"
                defaultValue={supplier?.email || ""}
              />
              <Input
                name="address"
                label="address"
                variant="bordered"
                defaultValue={supplier?.address || ""}
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
                {isSubmitting ? (
                  <Spinner color="white" variant="wave" />
                ) : (
                  <span>Update</span>
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
