"use client";
import {
  updateCompany,
  updateMenuCategory,
  updateTable,
} from "@/app/lib/action";
import {
  fetchCompany,
  fetchMenuCategoryWithId,
  fetchTableWithId,
} from "@/app/lib/data";
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
import { Company, MenuCategory, Table } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function UpdateCompanyDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [prevData, setPrevData] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const getCompany = async () => {
        const company = await fetchCompany();
        setPrevData(company);
        setIsLoading(false);
      };
      getCompany();
    }
  }, [isOpen]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const { isSuccess, message } = await updateCompany(formData);
    setIsSubmitting(false);
    if (isSuccess) {
      toast.success(message);
      onClose();
    } else toast.error(message);
  };

  return (
    <div className="relative">
      <Button className="bg-primary w-24 text-white" onPress={onOpen}>
        Update
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Update Company
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Input
                    name="name"
                    label="Name *"
                    variant="bordered"
                    defaultValue={prevData?.name}
                    required
                  />
                  <Input
                    name="street"
                    label="Street *"
                    variant="bordered"
                    defaultValue={prevData?.street}
                    required
                  />
                  <Input
                    name="township"
                    label="Township *"
                    variant="bordered"
                    defaultValue={prevData?.township}
                    required
                  />
                  <Input
                    name="city"
                    label="City *"
                    variant="bordered"
                    defaultValue={prevData?.city}
                    required
                  />
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
