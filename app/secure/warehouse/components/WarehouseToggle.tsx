"use client";
import { updateSelectWarehouse } from "@/app/lib/warehouse/action";
import {
  addToast,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import { SelectedWarehouse, Warehouse } from "@prisma/client";
import { AltArrowDown, PenNewSquare } from "@solar-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WarehouseToggle({
  warehouse,
  selectedWarehouse,
}: {
  warehouse: Warehouse[];
  selectedWarehouse: SelectedWarehouse;
}) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<Set<string>>(new Set([]));

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (warehouse.length === 1) {
      setSelectedKey(new Set([String(warehouse[0].id)]));
    } else {
      setSelectedKey(new Set([String(selectedWarehouse.warehouseId)]));
    }
  }, [warehouse, selectedWarehouse.warehouseId]);

  const handleSelectChange = async (e: any) => {
    const selectedWarehouse = Array.from(e)[0];
    if (selectedWarehouse === "action") return;
    setIsLoading(true);
    const { isSuccess, message, warehouseId } = await updateSelectWarehouse(
      Number(selectedWarehouse)
    );
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    setSelectedKey(new Set([String(warehouseId)]));
    setIsLoading(false);
  };

  const selectedWarehouseId = Number(Array.from(new Set(selectedKey))[0]);

  const selectedWarehouseName = warehouse.find(
    (item) => item.id === selectedWarehouseId
  )?.name;

  return (
    <Dropdown className="bg-background">
      <DropdownTrigger>
        <Button
          isDisabled={isLoading}
          variant="light"
          className="bg-background p-2"
          endContent={<AltArrowDown className="text-primary" />}
        >
          {isLoading ? <Spinner size="sm" /> : selectedWarehouseName}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="location select"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={selectedKey}
        onSelectionChange={handleSelectChange}
      >
        <DropdownSection showDivider>
          <DropdownItem
            key="action"
            onPress={() => router.push("/secure/warehouse/manage")}
            endContent={<PenNewSquare className="size-5 text-primary" />}
          >
            Manage
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          {warehouse.map((item) => (
            <DropdownItem key={item.id.toString()}>{item.name}</DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
