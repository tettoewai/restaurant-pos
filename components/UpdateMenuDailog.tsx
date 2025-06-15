"use client";

import { deleteMenuImage, updateMenu } from "@/app/lib/backoffice/action";
import {
  fetchMenuCategoryWithMenu,
  fetchMenuWithId,
} from "@/app/lib/backoffice/data";
import {
  addToast,
  Button,
  Form,
  Input,
  menu,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Spinner,
} from "@heroui/react";
import { Menu, MenuCategory, MenuCategoryMenu } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import FileDropZone from "./FileDropZone";
import MultipleSelector from "./MultipleSelector";

interface Props {
  id: number;
  menuCategory?: MenuCategory[];
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  menu?: Menu;
  menuCategoryMenu?: MenuCategoryMenu[];
}

export default function UpdateMenuDialog({
  id,
  menuCategory,
  isOpen,
  onOpenChange,
  onClose,
  menu,
  menuCategoryMenu,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Set<string>>(
    new Set([])
  );
  const [prevImage, setPrevImage] = useState<string>(menu?.assetUrl || "");
  const [menuImage, setMenuImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setPrevImage("");
    setMenuImage(null);
    setSelectedCategory(new Set([]));
    onClose();
  };

  useEffect(() => {
    if (menu) {
      setPrevImage(menu.assetUrl || "");
    }
    if (menuCategoryMenu) {
      const prevCategoryIds = menuCategoryMenu.map((item) =>
        String(item.menuCategoryId)
      );
      setSelectedCategory(new Set(prevCategoryIds));
    }
  }, [isOpen, menu, menuCategoryMenu]);

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const selectedCategoryArray = Array.from(selectedCategory);
    formData.append(
      "category",
      JSON.parse(JSON.stringify(selectedCategoryArray))
    );
    menuImage && formData.append("image", menuImage);
    if (!prevImage) deleteMenuImage(id);
    const { message, isSuccess } = await updateMenu({ formData });
    setIsSubmitting(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      handleClose();
    }
  };

  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={handleClose}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Update Menu</ModalHeader>
          <Form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <Input
                name="name"
                label="Name"
                variant="bordered"
                defaultValue={menu?.name}
                required
                isRequired
              />
              <NumberInput
                name="price"
                label="Price"
                variant="bordered"
                defaultValue={menu?.price}
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
                defaultValue={menu?.description || ""}
              />
              {prevImage ? (
                <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                  <span className="truncate ...">{prevImage}</span>
                  <IoMdClose
                    className="text-primary size-6 mr-3 cursor-pointer"
                    onClick={() => {
                      setPrevImage("");
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
            </ModalBody>
            <ModalFooter className="w-full">
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
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
