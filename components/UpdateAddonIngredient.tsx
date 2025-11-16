"use client";

import { AddonIngredientDataType } from "@/app/(secure)/warehouse/addon-ingredient/page";
import { updateAddonIngredient } from "@/app/lib/warehouse/action";
import { captilize, convertUnit, validUnits } from "@/function";
import {
  addToast,
  Button,
  Checkbox,
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
import { Addon, AddonIngredient, Menu, WarehouseItem } from "@prisma/client";
import { AddCircle, CloseCircle } from "@solar-icons/react/ssr";
import { useEffect, useState } from "react";
import { AddonIngredientForm } from "./NewAddonIngredient";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  menus?: Menu[];
  addons?: Addon[];
  warehouseItems?: WarehouseItem[];
  addonIngredientData?: AddonIngredientDataType;
  addonIngredients?: AddonIngredient[];
}

export default function UpdateAddonIngredientDialog({
  isOpen,
  onOpenChange,
  onClose,
  menus,
  addons,
  warehouseItems,
  addonIngredientData,
  addonIngredients,
}: Props) {
  const [itemIngredients, setItemIngredients] = useState<AddonIngredientForm[]>(
    [{ id: 1, itemId: 0, extraQty: 0, unit: "" }]
  );
  const [prevIngredient, setPrevIngredient] = useState<AddonIngredientForm[]>([
    { id: 1, itemId: 0, extraQty: 0, unit: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAll, setIsAll] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const errors: string[] = [];
    const seenItems = new Set<number>();

    if (!addonIngredientData) return onClose();

    const menuId = addonIngredientData.menuId;
    const addonId = addonIngredientData.addonId;

    formData.set("menu", String(addonIngredientData.menuId));
    formData.set("addon", String(addonIngredientData.addonId));

    const menuValid = isAll || menuId;

    const otherAddonIngredients = addonIngredients?.filter(
      (item) =>
        item.menuId !== addonIngredientData?.menuId ||
        item.addonId !== addonIngredientData?.addonId
    );

    const duplicateMenuAddon = otherAddonIngredients?.find(
      (item) => item.addonId === addonId && item.menuId === menuId
    );

    if (Boolean(duplicateMenuAddon))
      return addToast({
        title: "This menu and add-on already exist.",
        color: "danger",
      });

    for (const ingredient of itemIngredients) {
      if (!ingredient.itemId || ingredient.itemId === 0) {
        errors.push("Each ingredient must have an item selected.");
      }
      if (!ingredient.unit || ingredient.unit === "") {
        errors.push("Each ingredient must have a unit.");
      }
      if (ingredient.extraQty <= 0) {
        errors.push("Ingredient qauantity must be grater than 0.");
      }
      if (seenItems.has(ingredient.itemId)) {
        errors.push("Duplicate items are not allowed.");
      }
    }
    if (errors.length > 0) {
      return addToast({ title: errors.join("\n"), color: "danger" });
    }
    formData.set("addonIngredient", JSON.stringify(itemIngredients));

    if (!menuValid || !addonId)
      return addToast({ title: "Missing required fields.", color: "danger" });

    const prevIngredientJson = JSON.stringify(prevIngredient);
    const updateIngredientJson = JSON.stringify(itemIngredients);

    const ingredientChange = prevIngredientJson !== updateIngredientJson;
    if (!ingredientChange) return onClose();

    setIsSubmitting(true);

    const { isSuccess, message } = await updateAddonIngredient(formData);

    setIsSubmitting(false);

    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && addonIngredientData && warehouseItems) {
      const prevItemIngredient = addonIngredientData.ingredients.map(
        (item, index) => {
          const currentItem = warehouseItems.find(
            (wi) => wi.id === item.itemId
          );
          return {
            id: index,
            itemId: item.itemId,
            extraQty: currentItem
              ? convertUnit({ amount: item.extraQty, toUnit: currentItem.unit })
              : 0,
            unit: currentItem ? captilize(currentItem?.unit) : "",
          };
        }
      );
      setPrevIngredient(prevItemIngredient);
      setItemIngredients(prevItemIngredient);
    }
    if (addonIngredientData) {
      setIsAll(Boolean(!addonIngredientData.menuId));
    }
  }, [isOpen, addonIngredientData, warehouseItems]);

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
          <ModalHeader className="flex flex-col gap-1">Update Menu</ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <div className="flex space-x-1">
                <Select
                  label="Select an addon"
                  isRequired
                  isDisabled
                  name="addon"
                  defaultSelectedKeys={
                    addonIngredientData
                      ? new Set([String(addonIngredientData.addonId)])
                      : []
                  }
                >
                  {addons && addons.length ? (
                    addons.map((item) => (
                      <SelectItem key={item.id}>{item.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem key="none" isReadOnly>
                      There is no add-on.
                    </SelectItem>
                  )}
                </Select>

                <Select
                  label="Select a menu"
                  isRequired
                  name="menu"
                  defaultSelectedKeys={
                    addonIngredientData
                      ? new Set([String(addonIngredientData.menuId)])
                      : []
                  }
                  isDisabled
                >
                  {menus && menus.length ? (
                    menus.map((item) => (
                      <SelectItem key={item.id}>{item.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem key="none" isReadOnly>
                      There is no menu.
                    </SelectItem>
                  )}
                </Select>
                <Checkbox size="sm" isDisabled isSelected={isAll}>
                  All
                </Checkbox>
              </div>
              <h1>Ingredients</h1>
              <div className="space-y-2">
                {itemIngredients && itemIngredients.length
                  ? itemIngredients.map((item) => {
                      const currentWarehouseItem = warehouseItems?.find(
                        (wi) => wi.id === item.itemId
                      );
                      const units = currentWarehouseItem
                        ? validUnits(currentWarehouseItem.unitCategory)
                        : [""];
                      return (
                        <div
                          key={item.id}
                          className="flex space-x-2 justify-between items-center"
                        >
                          <Select
                            isRequired
                            label="Select an item"
                            selectedKeys={new Set([String(item.itemId)])}
                            onSelectionChange={(e) => {
                              const selectedValue = Number(Array.from(e)[0]);
                              setItemIngredients((prev) =>
                                prev.map((ingredient) =>
                                  ingredient.id === item.id
                                    ? { ...ingredient, itemId: selectedValue }
                                    : ingredient
                                )
                              );
                            }}
                          >
                            {warehouseItems && warehouseItems.length ? (
                              warehouseItems.map((wi) => {
                                const alreadySelected = Boolean(
                                  itemIngredients.find(
                                    (iid) => iid.itemId === wi.id
                                  )
                                );
                                return (
                                  <SelectItem
                                    className={alreadySelected ? "hidden" : ""}
                                    key={wi.id}
                                  >
                                    {wi.name}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem key="none" isReadOnly>
                                There is no warehouse item.
                              </SelectItem>
                            )}
                          </Select>
                          <NumberInput
                            label="extra Qty."
                            isRequired
                            value={item.extraQty}
                            onChange={(e) => {
                              setItemIngredients((prev) =>
                                prev.map((ingredient) =>
                                  item.id === ingredient.id
                                    ? {
                                        ...ingredient,
                                        extraQty: Number(e),
                                      }
                                    : ingredient
                                )
                              );
                            }}
                            endContent={
                              <select
                                required
                                className="bg-transparent"
                                value={
                                  item.unit ? captilize(String(item.unit)) : ""
                                }
                                onChange={(e) => {
                                  setItemIngredients((prev) => {
                                    return prev.map((ingredient) =>
                                      item.id === ingredient.id
                                        ? {
                                            ...ingredient,
                                            unit: String(e.target.value),
                                          }
                                        : ingredient
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
                                  prev.filter(
                                    (ingredient) => item.id !== ingredient.id
                                  )
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
              </div>
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
                        if (menus) {
                          return [
                            ...prev,
                            {
                              id: lastItemId + 1,
                              itemId: 0,
                              extraQty: 0,
                              unit: "",
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
                  <Spinner color="white" variant="wave" />
                ) : (
                  <span>Update</span>
                )}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
