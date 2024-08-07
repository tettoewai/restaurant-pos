"use client";
import { updateMenuCategory } from "@/app/lib/action";
import { fetchMenuCategoryWithId } from "@/app/lib/data";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { MenuCategory } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [prevData, setPrevData] = useState<MenuCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const getMenuCategory = async () => {
      const menuCategory = await fetchMenuCategoryWithId(id);
      setPrevData(menuCategory);
    };
    getMenuCategory();
  }, [isOpen, id]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const { isSuccess, message } = await updateMenuCategory(formData);
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
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
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Update Menu Category
              </ModalHeader>

              <form onSubmit={handleSubmit}>
                <ModalBody>
                  <Input
                    name="name"
                    label="Name *"
                    variant="bordered"
                    defaultValue={prevData?.name}
                    required
                  />
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
                    Update
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
