"use client";

import { createSupplier } from "@/app/lib/warehouse/action";
import ShortcutButton from "@/components/ShortCut";
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { useRef, useState } from "react";

export default function NewSupplierDailog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting === true) return;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as String;
    if (!name)
      return addToast({
        title: "Name is not privided!",
        color: "danger",
      });
    setIsSubmitting(true);
    const { isSuccess, message } = await createSupplier(formData);
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
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
      >
        <ShortcutButton onPress={() => onOpen()} keys={["ctrl"]} letter="O" />{" "}
        New Supplier
      </Button>
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
            Create Supplier
          </ModalHeader>

          <form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody>
              <Input
                name="name"
                label="Name"
                variant="bordered"
                isRequired
                autoFocus
              />
              <Input name="phoneNo" label="Phone no" variant="bordered" />
              <Input name="email" label="email" variant="bordered" />
              <Input name="address" label="address" variant="bordered" />
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? <Spinner color="white" /> : <span>Create</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
