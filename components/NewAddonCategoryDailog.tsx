"use client";
import {
  createAddonCategory,
  createMenuCategory,
} from "@/app/lib/backoffice/action";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { toast } from "react-toastify";
import MultipleSelector from "./MultipleSelector";
import { useRef, useState } from "react";
import { Menu } from "@prisma/client";
import { BsStar } from "react-icons/bs";
import ShortcutButton from "./ShortCut";

interface Props {
  menus: Menu[];
}

export default function NewAddonCategoryDialog({ menus }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set([]));
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const selectedMenuArray = Array.from(selectedMenus);
    formData.append("menu", JSON.parse(JSON.stringify(selectedMenuArray)));
    formData.set("isRequired", String(isRequired));
    const { isSuccess, message } = await createAddonCategory(formData);
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
        <ShortcutButton onClick={()=>onOpen()} keys={["command"]} letter="O"/> New Addon Category
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create Addon Category
          </ModalHeader>

          <form ref={formRef} onSubmit={handleSubmit}>
            <ModalBody>
              <Input
                name="name"
                label="Name"
                variant="bordered"
                isRequired
                autoFocus
              />
              <MultipleSelector
                selectedList={selectedMenus}
                setSelectedList={setSelectedMenus}
                isRequired
                menuList={menus}
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
