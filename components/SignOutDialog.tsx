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
import { Logout } from "@solar-icons/react";

export default function SignOutDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  return (
    <div className="relative">
      <Button
        onPress={onOpen}
        variant="ghost"
        color="primary"
        endContent={<Logout className="size-4" />}
        className="w-[120px]"
      >
        Sign out
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Sign out</ModalHeader>
          <ModalBody>Are you sure you went to Sign out?</ModalBody>
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
