"use client";
import { fetchAddonWithId } from "@/app/lib/data";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Addon, AddonCategory } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import MultipleSelector from "./MultipleSelector";
import { updateAddon } from "@/app/lib/action";
import { toast } from "react-toastify";

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
    const getPrevData = async () => {
      const addon = await fetchAddonWithId(id);
      setPrevData(addon);
      setSelectedAddonCat(new Set(String(addon?.addonCategoryId)));
    };
    getPrevData();
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
    if (isSuccess) {
      toast.success(message);
      closeModal();
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
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Update Addon
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
                  <MultipleSelector
                    selectedList={selectedAddonCat}
                    setSelectedList={setSelectedAddonCat}
                    isRequired
                    addonCategoryList={addonCategory}
                    itemType="addon"
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
