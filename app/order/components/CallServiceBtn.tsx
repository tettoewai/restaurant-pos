"use client";

import { callService } from "@/app/lib/order/action";
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
import { Table } from "@prisma/client";
import { SirenRounded } from "@solar-icons/react/ssr";
import { useState } from "react";

export default function CallServiceBtn({ table }: { table: Table }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [isCalling, setIsCalling] = useState(false);

  const handleCall = async () => {
    if (!table)
      return addToast({ title: "Table is not provided.", color: "danger" });
    setIsCalling(true);
    const { isSuccess, message } = await callService(table);
    setIsCalling(false);
    addToast({ title: message, color: isSuccess ? "success" : "danger" });
    if (isSuccess) {
      onClose();
    }
  };
  return (
    <>
      <Button
        color="primary"
        isIconOnly
        radius="full"
        className="flex flex-col size-16 p-1"
        size="lg"
        onPress={() => onOpen()}
      >
        <SirenRounded className="size-9" />
        Call
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
            Calling Service
          </ModalHeader>
          <ModalBody>Let us know if you need any service ❤️.</ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              isDisabled={isCalling}
              onPress={handleCall}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {isCalling ? <Spinner color="white" variant="wave" /> : "Call"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
