"use client";

import { updateWarehouseItem } from "@/app/lib/warehouse/action";
import { captilize, convertUnit } from "@/function";
import {
  addToast,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { WarehouseItem } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  warehouseItem?: WarehouseItem;
}

export default function UpdateWarehouseItemDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  warehouseItem,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedUnitCat, setSelectedUnitCat] = useState(new Set([""]));
  const [selectedUnit, setSelectedUnit] = useState(new Set([""]));

  useEffect(() => {
    if (warehouseItem) {
      setSelectedUnitCat(
        new Set([captilize(String(warehouseItem.unitCategory))])
      );
      setSelectedUnit(new Set([String(warehouseItem.unit)]));
    }
  }, [warehouseItem, isOpen]);

  const handleClose = () => {
    setSelectedUnitCat(new Set([""]));
    onClose();
  };

  const unitCategory = ["Mass", "Volume", "Count"];

  const unit = useMemo(() => {
    const selectedUnitCategory = Array.from(selectedUnitCat)[0];
    return selectedUnitCategory === "Mass"
      ? ["G", "KG", "LB", "OZ", "VISS"]
      : selectedUnitCategory === "Volume"
      ? ["ML", "L", "GAL"]
      : selectedUnitCategory === "Count"
      ? ["DOZ", "UNIT"]
      : null;
  }, [selectedUnitCat]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("id", String(id));
    const data = Object.fromEntries(formData);
    const name = data.name as string;
    const unitCategory = data.unitCategory as string;
    const unit = data.unit;
    const threshold = data.threshold;
    const isValid = id && name && unitCategory && unit && threshold;
    const nothingChange =
      name === warehouseItem?.name &&
      unitCategory.toUpperCase() === String(warehouseItem.unitCategory) &&
      unit === String(warehouseItem.unit) &&
      Number(threshold) === warehouseItem.threshold;
    if (nothingChange) return onClose();
    if (!isValid)
      return addToast({ color: "danger", title: "Missing required fields!" });
    setIsSubmitting(true);
    const { isSuccess, message } = await updateWarehouseItem(formData);
    setIsSubmitting(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      onClose();
    }
  };

  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onClose={handleClose}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Update Warehouse
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <Input
                name="name"
                label="Name"
                variant="bordered"
                isRequired
                autoFocus
                defaultValue={warehouseItem?.name}
              />
              <div className="flex justify-center items-center space-x-0.5">
                <Select
                  isRequired
                  className="w-1/2"
                  variant="bordered"
                  label="Unit Category"
                  name="unitCategory"
                  selectedKeys={selectedUnitCat}
                  onSelectionChange={(e) => {
                    setSelectedUnitCat(new Set([String(Array.from(e)[0])]));
                  }}
                >
                  {unitCategory.map((item) => (
                    <SelectItem key={item}>{item}</SelectItem>
                  ))}
                </Select>
                <Select
                  selectedKeys={selectedUnit}
                  onSelectionChange={(e) => {
                    setSelectedUnit(new Set([String(Array.from(e)[0])]));
                  }}
                  className="w-1/2"
                  variant="bordered"
                  label="Unit"
                  name="unit"
                  isRequired
                >
                  {unit ? (
                    unit.map((item) => (
                      <SelectItem key={item}>{item}</SelectItem>
                    ))
                  ) : (
                    <SelectItem key="null" isReadOnly>
                      Select unit category first.
                    </SelectItem>
                  )}
                </Select>
              </div>
              <NumberInput
                isRequired
                name="threshold"
                label="Threshold"
                variant="bordered"
                defaultValue={
                  warehouseItem
                    ? convertUnit({
                        amount: warehouseItem?.threshold,
                        toUnit: warehouseItem?.unit,
                      })
                    : 0
                }
              />
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? <Spinner color="white" /> : <span>Update</span>}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
