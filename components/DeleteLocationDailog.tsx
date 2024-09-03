import { deleteAddon, deleteLocation } from "@/app/lib/backoffice/action";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Location } from "@prisma/client";
import { toast } from "react-toastify";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  location?: Location[];
}

export default function DeleteLocationDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  location,
}: Props) {
  const handleLocal = () => {
    const isUpdateLocation = localStorage.getItem("isUpdateLocation") || "";
    localStorage.setItem(
      "isUpdateLocation",
      isUpdateLocation === "false" ? "true" : "false"
    );
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { isSuccess, message } = await deleteLocation(id);
    if (isSuccess) {
      toast.success(message);
      handleLocal();
      onClose();
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
          <ModalHeader className="flex flex-col gap-1">
            Delete Location
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <span>Are you sure you went to delete this location?</span>
              <input type="hidden" name="id" value={id} />
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
                Delete
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
