"use client";
import { updateMenuCategory, updateTable } from "@/app/lib/backoffice/action";
import {
  fetchMenuCategoryWithId,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
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
import { MenuCategory, Table } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function UpdateTableDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [prevData, setPrevData] = useState<Table | null | undefined>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const getTable = async () => {
        const table = await fetchTableWithId(id);
        setPrevData(table);
        setIsLoading(false);
      };
      getTable();
    }
  }, [isOpen, id]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const { isSuccess, message } = await updateTable(formData);
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
      onClose();
    } else toast.error(message);
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
          <ModalHeader className="flex flex-col gap-1">
            Update Table
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <Input
                  name="name"
                  label="Name"
                  variant="bordered"
                  defaultValue={prevData?.name}
                  required
                  isRequired
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
