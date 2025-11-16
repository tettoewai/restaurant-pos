import { setKnowCanceledOrder } from "@/app/lib/order/action";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Danger } from "@solar-icons/react/ssr";
import { useState } from "react";
import { mutate } from "swr";

interface Props {
  id: number;
  reason: string;
  tableId: number;
  canceledOrder: string[];
}

export default function NoticeCancelDialog({
  id,
  reason,
  tableId,
  canceledOrder,
}: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const { message, isSuccess } = await setKnowCanceledOrder(id);
    setIsLoading(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      mutate([tableId]); // Refetch orders data
      mutate([canceledOrder]); // Refetch canceled orders data
      onClose();
    }
  };

  if (!id && !reason) return;

  return (
    <div className="relative">
      <Danger
        className="size-7 text-red-500 ml-1 cursor-pointer"
        onClick={onOpen}
      />
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
        onClose={onClose}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Sorry, your order is canceled
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div className="flex flex-col">
                <span>Reason</span>
                <span className="text-xs">{reason}</span>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isLoading}
              >
                {isLoading ? (
                  <Spinner color="white" variant="wave" />
                ) : (
                  "Got it"
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
