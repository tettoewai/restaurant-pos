"use client";

import { deleteImage, updateMenu } from "@/app/lib/backoffice/action";
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
import { Menu, MenuCategory } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import FileDropZone from "./FileDropZone";
import MultipleSelector from "./MultipleSelector";
import {
  fetchMenuWithId,
  fetchMenuCategoryWithMenu,
} from "@/app/lib/backoffice/data";

interface Props {
  id: number;
  menuCategory?: MenuCategory[];
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function UpdateMenuDialog({
  id,
  menuCategory,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [prevData, setPrevData] = useState<Menu | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Set<string>>(
    new Set([])
  );
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const getPrevMenu = async () => {
        setIsLoading(true);
        const [prevMenu, prevCategories] = await Promise.all([
          fetchMenuWithId(id),
          fetchMenuCategoryWithMenu(id),
        ]);
        setPrevData(prevMenu);
        const prevCategoryIds = prevCategories.map((item) =>
          String(item.menuCategoryId)
        );
        setSelectedCategory(new Set(prevCategoryIds));
        setIsLoading(false);
      };
      getPrevMenu();
    }
  }, [isOpen, id]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const selectedCategoryArray = Array.from(selectedCategory);
    formData.append(
      "category",
      JSON.parse(JSON.stringify(selectedCategoryArray))
    );
    menuImage && formData.append("image", menuImage);
    if (!prevData?.assetUrl) deleteImage(id);
    const { message, isSuccess } = await updateMenu({ formData });
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
      onClose();
    } else {
      toast.error(message);
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Update Menu</ModalHeader>
          <form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Input
                    name="name"
                    label="Name"
                    variant="bordered"
                    defaultValue={prevData?.name}
                    required
                    isRequired
                  />
                  <Input
                    type="number"
                    name="price"
                    label="Price"
                    variant="bordered"
                    defaultValue={String(prevData?.price)}
                    endContent={
                      <span className="text-default-400 text-small">Kyats</span>
                    }
                    required
                    isRequired
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
                    defaultValue={prevData?.description || ""}
                  />
                  {prevData?.assetUrl ? (
                    <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                      <span className="truncate ...">{prevData.assetUrl}</span>
                      <IoMdClose
                        className="text-primary size-6x mr-3 cursor-pointer"
                        onClick={() => {
                          setPrevData({ ...prevData, assetUrl: "" });
                          setMenuImage(null);
                        }}
                      />
                    </div>
                  ) : menuImage ? (
                    <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                      <span className="truncate ...">{menuImage.name}</span>
                      <IoMdClose
                        className="text-primary size-6x mr-3 cursor-pointer"
                        onClick={() => setMenuImage(null)}
                      />
                    </div>
                  ) : (
                    <FileDropZone
                      onDrop={(files) => {
                        setMenuImage(files[0]);
                      }}
                    />
                  )}
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
