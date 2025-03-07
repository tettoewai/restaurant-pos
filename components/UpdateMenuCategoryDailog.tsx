"use client";
import { updateMenuCategory } from "@/app/lib/backoffice/action";
import { fetchMenuCategoryWithId } from "@/app/lib/backoffice/data";
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
import { MenuCategory } from "@prisma/client";
import { useEffect, useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function UpdateMenuCategoryDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prevData, setPrevData] = useState<MenuCategory | null>(null);

  useEffect(() => {
    if (isOpen) {
      const getMenuCategory = async () => {
        setIsLoading(true);
        const menuCategory = await fetchMenuCategoryWithId(id);
        setPrevData(menuCategory);
        setIsLoading(false);
      };
      getMenuCategory();
    }
  }, [isOpen, id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const { isSuccess, message } = await updateMenuCategory(formData);
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
            Update Menu Category
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Input
                  name="name"
                  label="Name"
                  variant="bordered"
                  defaultValue={prevData?.name}
                  required
                  isRequired
                  autoFocus
                />
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
                {isSubmitting ? <Spinner color="white" /> : <span>Update</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
