"use client";
import { createAddon } from "@/app/lib/backoffice/action";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { AddonCategory } from "@prisma/client";
import { useRef, useState } from "react";
import MultipleSelector from "./MultipleSelector";
import { toast } from "react-toastify";

interface Props {
  addonCategory: AddonCategory[];
}

export default function NewAddonDialog({ addonCategory }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
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
    const selectedAddonCatArray = Array.from(selectedAddonCat);
    formData.append(
      "addonCategory",
      JSON.parse(JSON.stringify(selectedAddonCatArray))
    );
    const { isSuccess, message } = await createAddon(formData);
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
        New Addon
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create Addon
          </ModalHeader>

          <form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody>
              <Input name="name" label="Name *" variant="bordered" required />
              <Input name="price" label="Price" variant="bordered" />
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
                {isSubmitting ? <Spinner color="white" /> : <span>Create</span>}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
