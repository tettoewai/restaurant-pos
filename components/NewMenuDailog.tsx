"use client";

import { createMenu } from "@/app/lib/backoffice/action";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { MenuCategory } from "@prisma/client";
import { useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import FileDropZone from "./FileDropZone";
import MultipleSelector from "./MultipleSelector";
import { Spinner } from "@nextui-org/spinner";

interface Props {
  menuCategory: MenuCategory[];
}

export default function NewMenuDialog({ menuCategory }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] = useState<Set<string>>(
    new Set([])
  );
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const closeModal = () => {
    onClose();
    setMenuImage(null);
    resetForm();
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const selectedCategoryArray = Array.from(selectedCategory);
    formData.append(
      "category",
      JSON.parse(JSON.stringify(selectedCategoryArray))
    );
    menuImage && formData.append("image", menuImage);
    const { message, isSuccess } = await createMenu({ formData });
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
      closeModal();
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
        New Menu
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Create Menu</ModalHeader>

          <form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody>
              <Input name="name" label="Name *" variant="bordered" required />
              <Input
                type="number"
                name="price"
                label="Price *"
                variant="bordered"
                endContent={
                  <span className="text-default-400 text-small">Kyats</span>
                }
                required
              />
              <MultipleSelector
                selectedList={selectedCategory}
                setSelectedList={setSelectedCategory}
                list={menuCategory}
                isRequired
                itemType="menu"
              />
              <Input
                name="description"
                label="Description"
                variant="bordered"
              />
              {menuImage ? (
                <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                  <span className="truncate ...">{menuImage.name}</span>
                  <IoMdClose
                    className="text-primary size-7 cursor-pointer"
                    onClick={() => setMenuImage(null)}
                  />
                </div>
              ) : (
                <FileDropZone onDrop={(files) => setMenuImage(files[0])} />
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
                {isSubmitting ? <Spinner color="white" /> : <span>Create</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
