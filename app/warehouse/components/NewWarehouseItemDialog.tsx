"use client";

import { createWarehouseItem } from "@/app/lib/warehouse/action";
import ShortcutButton from "@/components/ShortCut";
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
  useDisclosure,
} from "@heroui/react";
import { Unit, UnitCategory } from "@prisma/client";
import { useMemo, useState } from "react";

export default function NewWarehouseItemDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [selectedUnitCat, setSelectedUnitCat] = useState(new Set([""]));

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

  const handleClose = () => {
    setSelectedUnitCat(new Set([""]));
    onClose();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const name = data.name as string;
    const unitCategory = (
      data.unitCategory as string
    ).toUpperCase() as UnitCategory;
    const unit = (data.unit as string).toUpperCase() as Unit;
    const threshold = Number(data.threshold);
    const isValid =
      name &&
      unitCategory &&
      unit &&
      threshold &&
      typeof threshold === "number";
    if (!isValid)
      return addToast({
        title: "Missing required fields!",
        color: "danger",
      });
    setIsSubmitting(true);
    const { isSuccess, message } = await createWarehouseItem(formData);
    setIsSubmitting(false);

    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      handleClose();
    }
  };

  return (
    <div className="relative">
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
      >
        <ShortcutButton onPress={() => onOpen()} keys={["ctrl"]} letter="O" />{" "}
        New Warehouse Item
      </Button>
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
            Create Warehouse Item
          </ModalHeader>

          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <Input
                name="name"
                label="Name"
                variant="bordered"
                isRequired
                autoFocus
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
              />
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? <Spinner color="white" /> : <span>Create</span>}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
