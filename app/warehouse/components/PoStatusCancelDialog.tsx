"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";

interface Props {
  handleCanceled: () => void;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function PoStatusCancelDialog({
  handleCanceled,
  isOpen,
  onOpenChange,
  onClose,
  isLoading,
}: Props) {
  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Cancel PO</ModalHeader>
          <ModalBody>
            <span>
              Are you sure you want to cancel this PO? Make sure you did, you
              cannot update the canceled PO.
            </span>
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              onPress={handleCanceled}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {isLoading ? <Spinner size="sm" /> : "Yes, sure."}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
