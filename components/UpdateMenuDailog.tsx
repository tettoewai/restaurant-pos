"use client";

import { deletImage, updateMenu } from "@/app/lib/action";
import { fetchMenu, fetchMenuCategoryWithMenu } from "@/app/lib/data";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Menu, MenuCategory } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import FileDropZone from "./FileDropZone";
import MultipleSelector from "./MultipleSelector";

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
  useEffect(() => {
    const getPrevMenu = async () => {
      const prevMenu = await fetchMenu(id);
      setPrevData(prevMenu);
      const prevCategories = await fetchMenuCategoryWithMenu(id);
      const prevCategoryIds = prevCategories.map((item) =>
        String(item.menuCategoryId)
      );
      setSelectedCategory(new Set(prevCategoryIds));
    };
    getPrevMenu();
  }, [isOpen, id]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const selectedCategoryArray = Array.from(selectedCategory);
    formData.append(
      "category",
      JSON.parse(JSON.stringify(selectedCategoryArray))
    );
    menuImage && formData.append("image", menuImage);
    if (!prevData?.assetUrl) deletImage(id);
    const { message, isSuccess } = await updateMenu({ formData });
    if (isSuccess) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  return (
    <div className="relative">
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Update Menu
              </ModalHeader>

              <form ref={formRef} onSubmit={handleSubmit}>
                <ModalBody>
                  <Input
                    name="name"
                    label="Name *"
                    variant="bordered"
                    defaultValue={prevData?.name}
                    required
                  />
                  <Input
                    type="number"
                    name="price"
                    label="Price *"
                    variant="bordered"
                    defaultValue={String(prevData?.price)}
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
                  />
                  {prevData?.assetUrl ? (
                    <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                      <span className="truncate ...">{prevData.assetUrl}</span>
                      <IoMdClose
                        className="text-primary size-7 cursor-pointer"
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
                        className="text-primary size-7 cursor-pointer"
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
