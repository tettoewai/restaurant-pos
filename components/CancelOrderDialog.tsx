import { candelOrder } from "@/app/lib/order/action";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import { useState } from "react";
import { mutate } from "swr";

interface Props {
  id?: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

export default function CancelOrderDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setIsLoading(true);
    await candelOrder(id);
    setIsLoading(false);
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
            Cancel Order
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <span>Are you sure you went to cancel this order?</span>
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isLoading}
              >
                {isLoading ? <Spinner color="white" /> : "Cancel order"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
