"use client";
import {
  createLocation,
  createMenuCategory,
} from "@/app/lib/backoffice/action";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NewLocationDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleLocal = () => {
    const isUpdateLocation = localStorage.getItem("isUpdateLocation") || "";
    localStorage.setItem(
      "isUpdateLocation",
      isUpdateLocation === "false" ? "true" : "false"
    );
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const { isSuccess, message } = await createLocation(formData);
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
      handleLocal();
      onClose();
    } else {
      toast.error(message);
    }
  };

  return (
    <div className="relative">
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
      >
        New Location
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create Location
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Input name="name" label="Name *" variant="bordered" required />
              <Input
                name="street"
                label="Street *"
                variant="bordered"
                required
              />
              <Input
                name="township"
                label="Township *"
                variant="bordered"
                required
              />
              <Input name="city" label="City *" variant="bordered" required />
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onClick={onClose}
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
