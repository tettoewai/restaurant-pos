import { cancelOrder } from "@/app/lib/backoffice/action";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

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
    if (!isValid)
      return addToast({
        title: "Missng required fields",
        color: "success",
      });
    const { isSuccess, message } = await cancelOrder(formData);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      onClose();
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
        scrollBehavior="inside"
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
                onPress={onClose}
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
