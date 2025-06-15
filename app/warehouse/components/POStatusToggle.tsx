"use client";

import { receivePurchaseOrder } from "@/app/lib/warehouse/action";
import { captilize } from "@/function";
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import { $Enums } from "@prisma/client";
import { useState } from "react";

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
  return (
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
          {isLoading ? <Spinner size="sm" /> : captilize(status)}
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
          onPress={async () => {
            setIsLoading(true);
            const { isSuccess, message } = await receivePurchaseOrder(poId);
            addToast({
              title: message,
              color: isSuccess ? "success" : "danger",
            });
            setIsLoading(false);
          }}
        >
          Received
        </DropdownItem>
        <DropdownItem key="cancelled" className="text-danger" color="danger">
          Cancelled
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
