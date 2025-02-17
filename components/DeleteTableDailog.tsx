import { deleteMenuCategory, deleteTable } from "@/app/lib/backoffice/action";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { toast } from "react-toastify";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function DeleteTableDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    const { isSuccess, message } = await deleteTable(id);
    if (isSuccess) {
      toast.success(message);
      onClose();
    } else {
      toast.error(message);
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Delete Table
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <span>Are you sure you went to delete this table?</span>
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
              >
                Delete
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
