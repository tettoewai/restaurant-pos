"use client";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { OrderData } from "@/general";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { AddCircle, CloseCircle } from "@solar-icons/react";
import { Dispatch, useContext } from "react";

interface Props {
  addToPaid: (item: OrderData, dialog?: boolean) => void;
  quantityDialogData: OrderData;
  setQuantityDialogData: Dispatch<OrderData>;
  prevQuantity: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: () => void;
}

export default function QuantityDialog({
  addToPaid,
  quantityDialogData,
  setQuantityDialogData,
  prevQuantity,
  isOpen,
  onOpen,
  onClose,
  onOpenChange,
}: Props) {
  const { paid } = useContext(BackOfficeContext);
  const handleQuatity = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= prevQuantity) {
      setQuantityDialogData({ ...quantityDialogData, quantity: newQuantity });
    }
  };
  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="bg-background"
      placement="center"
      size="xs"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Paid Quantity</ModalHeader>
        <ModalBody className="items-center">
          <div className="flex space-x-2 justify-center items-center">
            <Button
              isIconOnly
              variant="flat"
              isDisabled={quantityDialogData.quantity === 1}
              onPress={() =>
                quantityDialogData.quantity &&
                handleQuatity(quantityDialogData.quantity - 1)
              }
            >
              <CloseCircle className="size-7 text-primary" />
            </Button>
            <div className="px-5 py-3 rounded-md flex justify-center items-center text-lg h-full bg-gray-200 dark:bg-gray-900">
              {quantityDialogData.quantity}
            </div>
            <Button
              variant="flat"
              isIconOnly
              isDisabled={quantityDialogData.quantity === prevQuantity}
              onPress={() =>
                quantityDialogData.quantity &&
                handleQuatity(quantityDialogData.quantity + 1)
              }
            >
              <AddCircle className="size-7 text-primary" />
            </Button>
          </div>
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
            onPress={() => {
              addToPaid(quantityDialogData, true);
              onClose();
            }}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
