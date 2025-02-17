"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { signOut } from "next-auth/react";

export default function SignOutDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  return (
    <div className="relative">
      <Button className="bg-primary w-24 text-white" onPress={onOpen}>
        Sign out
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Sign out</ModalHeader>
          <ModalBody>
            <span>Are you sure you went to Sign out?</span>
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
              onPress={() => signOut()}
            >
              Sign out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
