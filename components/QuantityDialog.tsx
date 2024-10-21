"use client";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { OrderData } from "@/Generial";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Dispatch, useContext } from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";

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
  const { paid, setPaid } = useContext(BackOfficeContext);
  const handleQuatity = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= prevQuantity) {
      setQuantityDialogData({ ...quantityDialogData, quantity: newQuantity });
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="bg-background"
      placement="center"
      size="xs"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Paid Quantity</ModalHeader>
        <ModalBody className="items-center">
          <div className="flex space-x-1">
            <button
              onClick={() =>
                quantityDialogData.quantity &&
                handleQuatity(quantityDialogData.quantity - 1)
              }
            >
              <CiCircleMinus className="size-7 text-primary" />
            </button>
            <div className="px-5 py-3 rounded-md flex justify-center items-center text-lg h-full bg-gray-200 dark:bg-gray-900">
              {quantityDialogData.quantity}
            </div>
            <button
              onClick={() =>
                quantityDialogData.quantity &&
                handleQuatity(quantityDialogData.quantity + 1)
              }
            >
              <CiCirclePlus className="size-7 text-primary" />
            </button>
          </div>
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
            onClick={() => {
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
