import { cancelOrder } from "@/app/lib/backoffice/action";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@nextui-org/react";
import { toast } from "react-toastify";

interface Props {
  itemId: string;
  isOpen: boolean;
  onOpenChange: () => void;
  onOpen: () => void;
  onClose: () => void;
}

export default function CancelOrderBODialog({
  itemId,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const reason = formData.get("cancelReason");
    const id = formData.get("itemId");
    const isValid = id && reason;
    if (!isValid) return toast.error("Missng required fields");
    const { isSuccess, message } = await cancelOrder(formData);
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
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Cancel Order
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <span>Are you sure you went to cancel this order? Why?</span>
              <input name="itemId" defaultValue={itemId} className="hidden" />
              <Textarea
                label="Why do you cancel customer's order?"
                placeholder="Reason"
                variant="bordered"
                name="cancelReason"
                required
                isRequired
              />
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
              >
                Confirm
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
