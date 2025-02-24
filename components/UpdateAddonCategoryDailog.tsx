"use client";

import { updateAddonCategory } from "@/app/lib/backoffice/action";
import {
  fetchAddonCategoryWithId,
  fetchMenuAddonCategory,
} from "@/app/lib/backoffice/data";
import {
  addToast,
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { AddonCategory, Menu } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { BsStar } from "react-icons/bs";
import MultipleSelector from "./MultipleSelector";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  menu?: Menu[];
}

export default function UpdateAddonCategoryDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  menu,
}: Props) {
  const [prevData, setPrevData] = useState<AddonCategory | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set([]));
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const closeModal = () => {
    onClose();
    setSelectedMenus(new Set([]));
    setIsRequired(false);
    resetForm();
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const getMenuCategory = async () => {
        setIsLoading(true);
        const addonCategory = await fetchAddonCategoryWithId(id);
        setPrevData(addonCategory);
        addonCategory && setIsRequired(addonCategory.isRequired);
        const menuAddonCategory = await fetchMenuAddonCategory();
        const validMenu = menuAddonCategory
          .filter((item) => item.addonCategoryId === id)
          .map((menuAddonCat) => String(menuAddonCat.menuId));
        setSelectedMenus(new Set(validMenu));
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
    const selectedMenuArray = Array.from(selectedMenus);
    formData.append("menu", JSON.parse(JSON.stringify(selectedMenuArray)));
    formData.set("isRequired", String(isRequired));
    const { isSuccess, message } = await updateAddonCategory(formData);
    setIsSubmitting(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      closeModal();
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
            Update Addon Category
          </ModalHeader>

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
                    isRequired
                    required
                  />
                  <MultipleSelector
                    selectedList={selectedMenus}
                    setSelectedList={setSelectedMenus}
                    isRequired
                    menuList={menu}
                    itemType="addonCategory"
                  />
                  <Checkbox
                    isSelected={isRequired}
                    onValueChange={setIsRequired}
                    icon={<BsStar className="text-primary" />}
                    name="isRequired"
                  >
                    Required
                  </Checkbox>
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
