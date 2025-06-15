"use client";
import { updateAddon } from "@/app/lib/backoffice/action";
import { fetchAddonWithId } from "@/app/lib/backoffice/data";
import {
  addToast,
  Button,
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
}

export default function UpdateAddonDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  addonCategory,
}: Props) {
  const [prevData, setPrevData] = useState<Addon | null>(null);
  const [selectedAddonCat, setSelectedAddonCat] = useState<Set<string>>(
    new Set([])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      const getPrevData = async () => {
        setIsLoading(true);
        const addon = await fetchAddonWithId(id);
        setPrevData(addon);
        setSelectedAddonCat(new Set(String(addon?.addonCategoryId)));
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
    const selectedAddonCatArray = Array.from(selectedAddonCat);
    formData.append(
      "addonCategory",
      JSON.parse(JSON.stringify(selectedAddonCatArray))
    );
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
                  <NumberInput
                    name="price"
                    label="Price"
                    variant="bordered"
                    defaultValue={prevData?.price}
                  />
                  <MultipleSelector
                    selectedList={selectedAddonCat}
                    setSelectedList={setSelectedAddonCat}
                    isRequired
                    addonCategoryList={addonCategory}
                    itemType="addon"
                  />
                </>
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
