"use client";
import { updateAddon } from "@/app/lib/backoffice/action";
import {
  addToast,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Spinner,
} from "@heroui/react";
import { Addon, AddonCategory } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import MultipleSelector from "./MultipleSelector";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  addonCategory?: AddonCategory[];
  addon?: Addon;
}

export default function UpdateAddonDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  addonCategory,
  addon
}: Props) {

  const [selectedAddonCat, setSelectedAddonCat] = useState<Set<string>>(
    new Set([])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const closeModal = () => {
    onClose();
    setSelectedAddonCat(new Set([]));
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
    const name = formData.get("name") as string;
    formData.set("id", String(id));
    const selectedAddonCatArray = Array.from(selectedAddonCat);
    formData.append(
      "addonCategory",
      JSON.parse(JSON.stringify(selectedAddonCatArray))
    );
    const isValid = name && typeof name === "string" && selectedAddonCat.size > 0
    const nothingChanged = name === addon?.name && selectedAddonCatArray[0] === String(addon?.addonCategoryId) && Boolean(formData.has("needIngredient")) === addon?.needIngredient
    if(nothingChanged){
      setIsSubmitting(false);
      addToast({title:"Nothing changed",color:"warning"})
      return;
    }
    const { isSuccess, message } = await updateAddon(formData);
    setIsSubmitting(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      closeModal();
    }
  };

  useEffect(() => {
    if (addon?.addonCategoryId && isOpen) {
      setSelectedAddonCat(new Set([String(addon.addonCategoryId)]));
    }}, [addon,isOpen]);

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
            Update Addon
          </ModalHeader>

          <Form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody className="w-full">
             <Input
                    name="name"
                    label="Name"
                    variant="bordered"
                    defaultValue={addon?.name}
                    required
                    isRequired
                  />
                  <NumberInput
                    name="price"
                    label="Price"
                    variant="bordered"
                    defaultValue={addon?.price}
                  />
                  <MultipleSelector
                    selectedList={selectedAddonCat}
                    setSelectedList={setSelectedAddonCat}
                    isRequired
                    addonCategoryList={addonCategory}
                    itemType="addon"
                  />
                  <div className="w-full flex justify-end">
                    <Checkbox name="needIngredient" defaultSelected={addon?.needIngredient}>Need ingredient</Checkbox>
                  </div>
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
