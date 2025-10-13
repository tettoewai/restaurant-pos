"use client";

import { editMenuItemIngredient } from "@/app/lib/warehouse/action";
import { captilize, convertUnit, validUnits } from "@/function";
import {
  addToast,
  Button,
  Form,
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
import { Menu, MenuItemIngredient, WarehouseItem } from "@prisma/client";
import { AddCircle, CloseCircle } from "@solar-icons/react";
import { useEffect, useState } from "react";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  ingredients?: MenuItemIngredient[];
  menu?: Menu;
  warehouseItems?: WarehouseItem[];
}

export interface MenuItemIngredientForm {
  id: number;
  menuId: number;
  quantity: number;
  itemId: number;
  unit?: String;
}

export default function EditMenuIngredient({
  id,
  isOpen,
  onOpenChange,
  onClose,
  ingredients,
  menu,
  warehouseItems,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemIngredients, setItemIngredients] = useState<
    MenuItemIngredientForm[]
  >([]);

  useEffect(() => {
    if (isOpen && ingredients && ingredients.length) {
      const convertedIngredients = ingredients.map((item) => {
        const currentItem = warehouseItems?.find(
          (whi) => whi.id === item.itemId
        );
        return {
          ...item,
          quantity: currentItem
            ? Number(
                convertUnit({
                  amount: item.quantity,
                  toUnit: currentItem.unit,
                })
              )
            : 0,
          unit: currentItem ? captilize(currentItem.unit) : "",
        };
      });
      setItemIngredients(convertedIngredients);
    } else if (menu) {
      setItemIngredients([
        { id: 1, menuId: menu.id, itemId: 0, quantity: 0, unit: undefined },
      ]);
    }
  }, [isOpen, ingredients, menu, warehouseItems]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const errors: string[] = [];
    const seenItems = new Set<number>();
    const isValid =
      itemIngredients && itemIngredients.length && itemIngredients[0].menuId;
    if (!isValid)
      return addToast({ title: "Missing required fields!", color: "danger" });

    for (const ingredient of itemIngredients) {
      if (!ingredient.itemId || ingredient.itemId === 0) {
        errors.push("Each ingredient must have an item selected.");
      }
      if (!ingredient.unit || ingredient.unit === "") {
        errors.push("Each ingredient must have a unit.");
      }
      if (ingredient.quantity <= 0) {
        errors.push("Ingredient qauantity must be grater than 0.");
      }
      if (seenItems.has(ingredient.itemId)) {
        errors.push("Duplicate items are not allowed.");
      }
      seenItems.add(ingredient.itemId);
    }
    if (errors.length > 0) {
      return addToast({ title: errors.join("\n"), color: "danger" });
    }
    setIsSubmitting(true);
    const { isSuccess, message } = await editMenuItemIngredient(
      itemIngredients
    );
    setIsSubmitting(false);

    addToast({ title: message, color: isSuccess ? "success" : "danger" });
    if (isSuccess) {
      onClose();
    }
  };

  return (
    <div className="relative">
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
            Edit Ingredient of {menu?.name}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              {itemIngredients && itemIngredients.length
                ? itemIngredients.map((ingredient) => {
                    const currentItem = warehouseItems?.find(
                      (item) => item.id === ingredient.itemId
                    );
                    const units = currentItem
                      ? validUnits(currentItem.unitCategory)
                      : [""];
                    return (
                      <div
                        key={ingredient.id}
                        className="flex space-x-1 items-center"
                      >
                        <Select
                          label="Item"
                          className="w-1/2"
                          selectedKeys={new Set([String(currentItem?.id)])}
                          onSelectionChange={(e) => {
                            const selectedValue = Number(Array.from(e)[0]);
                            setItemIngredients((prev) =>
                              prev.map((item) =>
                                item.id === ingredient.id
                                  ? { ...item, itemId: selectedValue }
                                  : item
                              )
                            );
                          }}
                          isRequired
                        >
                          {warehouseItems && warehouseItems.length ? (
                            warehouseItems.map((item) => {
                              const alreadySelected = Boolean(
                                itemIngredients.find(
                                  (iid) => iid.itemId === item.id
                                )
                              );

                              return (
                                <SelectItem
                                  className={alreadySelected ? "hidden" : ""}
                                  key={item.id}
                                >
                                  {item.name}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem isReadOnly key="none">
                              There is no warehouse item.
                            </SelectItem>
                          )}
                        </Select>
                        <NumberInput
                          isRequired
                          className="w-1/2"
                          label="Amount"
                          onChange={(e) => {
                            setItemIngredients((prev) =>
                              prev.map((item) =>
                                item.id === ingredient.id
                                  ? {
                                      ...item,
                                      quantity: Number(e),
                                    }
                                  : item
                              )
                            );
                          }}
                          value={ingredient.quantity}
                          endContent={
                            <select
                              required
                              className="bg-transparent"
                              value={captilize(String(ingredient.unit))}
                              onChange={(e) => {
                                setItemIngredients((prev) => {
                                  return prev.map((item) =>
                                    item.id === ingredient.id
                                      ? {
                                          ...item,
                                          unit: String(e.target.value),
                                        }
                                      : item
                                  );
                                });
                              }}
                            >
                              <option className="hidden" key=""></option>
                              {units.map((item) => (
                                <option key={item}>{item}</option>
                              ))}
                            </select>
                          }
                        />
                        {itemIngredients.length > 1 ? (
                          <Button
                            isIconOnly
                            color="primary"
                            variant="light"
                            onPress={() =>
                              setItemIngredients((prev) =>
                                prev.filter((item) => item.id !== ingredient.id)
                              )
                            }
                          >
                            <CloseCircle />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })
                : null}
              {warehouseItems &&
              warehouseItems.length !== itemIngredients.length ? (
                <div className="w-full flex justify-center items-center">
                  <Button
                    isIconOnly
                    variant="ghost"
                    color="primary"
                    onPress={() =>
                      setItemIngredients((prev) => {
                        const lastItemId =
                          itemIngredients[itemIngredients.length - 1].id;
                        if (menu) {
                          return [
                            ...prev,
                            {
                              id: lastItemId + 1,
                              menuId: menu.id,
                              itemId: 0,
                              quantity: 0,
                            },
                          ];
                        } else {
                          return prev;
                        }
                      })
                    }
                  >
                    <AddCircle />
                  </Button>
                </div>
              ) : null}
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
                {isSubmitting ? (
                  <Spinner color="white" />
                ) : (
                  <span>Confirm</span>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
