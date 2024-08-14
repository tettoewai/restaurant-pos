"use client";
import { updateLocation, updateMenuCategory } from "@/app/lib/action";
import { fetchLocationWithId, fetchMenuCategoryWithId } from "@/app/lib/data";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import { Location, MenuCategory } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const handleLocal = () => {
    const isUpdateLocation = localStorage.getItem("isUpdateLocation") || "";
    localStorage.setItem(
      "isUpdateLocation",
      isUpdateLocation === "false" ? "true" : "false"
    );
  };
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
    if (isSuccess) {
      toast.success(message);
      handleLocal();
      onClose();
    } else toast.error(message);
  };

  return (
    <div className="relative">
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Update Location
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Input
                    name="name"
                    label="Name *"
                    variant="bordered"
                    required
                    defaultValue={prevData?.name}
                  />
                  <Input
                    name="street"
                    label="Street *"
                    variant="bordered"
                    defaultValue={prevData?.street}
                    required
                  />
                  <Input
                    name="township"
                    label="Township *"
                    variant="bordered"
                    defaultValue={prevData?.township}
                    required
                  />
                  <Input
                    name="city"
                    label="City *"
                    variant="bordered"
                    required
                    defaultValue={prevData?.city}
                  />
                </>
              )}
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
                {isSubmitting ? <Spinner color="white" /> : <span>Update</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
