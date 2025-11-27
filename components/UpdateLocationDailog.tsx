"use client";
import { updateLocation } from "@/app/lib/backoffice/action";
import { fetchLocationWithId } from "@/app/lib/backoffice/data";
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
import { Location } from "@prisma/client";
import { useEffect, useState } from "react";
import LocationButton from "./LocationButton";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function UpdateLocationDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [prevData, setPrevData] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const getPrevData = async () => {
        setIsLoading(true);
        const location = await fetchLocationWithId(id);
        location && setPrevData(location);
        setIsLoading(false);
      };
      getPrevData();
    }
  }, [isOpen, id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const { isSuccess, message } = await updateLocation(formData);
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
            Update Location
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <Spinner size="sm" variant="wave" />
              ) : (
                <>
                  <Input
                    name="name"
                    label="Name"
                    variant="bordered"
                    required
                    isRequired
                    defaultValue={prevData?.name}
                  />
                  <Input
                    name="street"
                    label="Street"
                    variant="bordered"
                    defaultValue={prevData?.street}
                    required
                    isRequired
                  />
                  <Input
                    name="township"
                    label="Township"
                    variant="bordered"
                    defaultValue={prevData?.township}
                    required
                    isRequired
                  />
                  <Input
                    name="city"
                    label="City"
                    variant="bordered"
                    required
                    isRequired
                    defaultValue={prevData?.city}
                  />
                  <LocationButton prevData={prevData} />
                </>
              )}
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
                isDisabled={isSubmitting || isLoading}
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
