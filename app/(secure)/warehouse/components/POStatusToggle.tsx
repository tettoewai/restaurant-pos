"use client";

import {
  cancelPurchaseOrder,
  receivePurchaseOrder,
} from "@/app/lib/warehouse/action";
import { captilize } from "@/function";
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { $Enums } from "@prisma/client";
import { useState } from "react";
import PoStatusReceivedDialog from "./PoStatusReceivedDialog";
import PoStatusCancelDialog from "./PoStatusCancelDialog";

export default function POStatusToggle({
  poId,
  status,
  isDisable,
}: {
  poId: number;
  status: $Enums.POStatus;
  isDisable?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onOpenChange: onCancelOpenChange,
    onClose: onCancelClose,
  } = useDisclosure();

  const onReceived = async () => {
    setIsLoading(true);
    const { isSuccess, message } = await receivePurchaseOrder(poId);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    setIsLoading(false);
    onClose();
  };
  const onCanceled = async () => {
    setIsLoading(true);
    const { isSuccess, message } = await cancelPurchaseOrder(poId);
    addToast({ title: message, color: isSuccess ? "success" : "danger" });
    setIsLoading(false);
    onCancelClose();
  };
  return (
    <>
      <Dropdown isDisabled={isDisable}>
        <DropdownTrigger>
          <Button
            variant="light"
            color={
              status === "PENDING"
                ? "warning"
                : status === "RECEIVED"
                ? "success"
                : status === "CANCELLED"
                ? "danger"
                : "default"
            }
          >
            {isLoading ? (
              <Spinner size="sm" variant="wave" />
            ) : (
              captilize(status)
            )}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownItem
            key="pending"
            color="warning"
            className={status === "PENDING" ? "hidden" : "flex text-warning"}
          >
            Pending
          </DropdownItem>
          <DropdownItem
            key="received"
            className="text-success"
            color="success"
            onPress={() => onOpen()}
          >
            Received
          </DropdownItem>
          <DropdownItem
            key="cancelled"
            className="text-danger"
            color="danger"
            onPress={() => onCancelOpen()}
          >
            Cancelled
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <PoStatusReceivedDialog
        handleReceived={onReceived}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        isLoading={isLoading}
      />
      <PoStatusCancelDialog
        handleCanceled={onCanceled}
        isOpen={isCancelOpen}
        onOpenChange={onCancelOpenChange}
        onClose={onCancelClose}
        isLoading={isLoading}
      />
    </>
  );
}
