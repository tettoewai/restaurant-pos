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

  const handleSignOut = async () => {
    try {
      // Close modal first
      onClose();

      // Sign out with redirect - this should clear the session cookie
      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback: manually clear cookies and redirect
      if (typeof window !== "undefined") {
        // Clear all cookies that might be related to NextAuth
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Clear NextAuth session cookies (try different cookie name patterns)
          if (
            name.includes("next-auth") ||
            name.includes("authjs") ||
            name.startsWith("__Secure-next-auth") ||
            name.startsWith("next-auth")
          ) {
            // Clear with different path and domain combinations
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname};`;
          }
        });

        // Clear sessionStorage and localStorage
        sessionStorage.clear();
        localStorage.removeItem("nextauth.message");

        // Force hard redirect to login
        window.location.href = "/login";
      }
    }
  };

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
          <ModalBody>Are you sure you want to sign out?</ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              onPress={handleSignOut}
            >
              Sign out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
