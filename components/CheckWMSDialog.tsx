"use client";
import { checkWMS } from "@/function";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { useState } from "react";

export default function CheckWMSDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [checking, setChecking] = useState(false);

  const handleCheckWMS = async () => {
    setChecking(true);
    const result = await checkWMS();
    setChecking(false);
  };
  return (
    <div className="relative">
      <Button className="bg-primary w-24 text-white" onPress={onOpen}>
        Check
      </Button>
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
          <ModalHeader className="flex flex-col gap-1">
            Checking WMS
          </ModalHeader>
          <ModalBody>
            {checking ? (
              <Spinner title="Checking" />
            ) : (
              <span>Are you sure you went to check WMS?</span>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              onPress={() => handleCheckWMS()}
            >
              Check
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
