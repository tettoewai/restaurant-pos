"use client";

import { fetchMenuAddonCategoryWithMenuId } from "@/app/lib/backoffice/data";
import { createAddonIngredient } from "@/app/lib/warehouse/action";
import { captilize, validUnits } from "@/function";
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
  SelectSection,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  Addon,
  AddonCategory,
  AddonIngredient,
  Menu,
  MenuAddonCategory,
  WarehouseItem,
} from "@prisma/client";
import { useState } from "react";
import { RxCross1, RxPlus } from "react-icons/rx";
import ShortcutButton from "./ShortCut";
import { prisma } from "@/db";
import { fetchMenuAddonCategoryWithCategoryAndMenu } from "@/app/lib/warehouse/data";

interface Props {
  addons: Addon[];
  warehouseItems: WarehouseItem[];
  menus: Menu[];
  addonIngredients: AddonIngredient[];
  addonCategories: AddonCategory[];
}

export interface AddonIngredientForm {
  id: number;
  itemId: number;
  extraQty: number;
  unit: string;
}

export interface AddonGroupWithCategoryType {
  categoryName: string;
  addons: Addon[];
}

export default function NewAddonIngredientDialog({
  addons,
  warehouseItems,
  menus,
  addonIngredients,
  addonCategories,
}: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const closeModal = () => {
    onClose();
    setItemIngredients([{ id: 1, itemId: 0, extraQty: 0, unit: "" }]);
  };

  const [itemIngredients, setItemIngredients] = useState<AddonIngredientForm[]>(
    [{ id: 1, itemId: 0, extraQty: 0, unit: "" }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAll, setIsAll] = useState(false);

  const addonWithCategory: (AddonGroupWithCategoryType | undefined)[]= addonCategories.map(
    (item) => {
      const relatedAddons = addons.filter(
        (addon) => addon.addonCategoryId && addon.needIngredient
      );
      if (relatedAddons.length === 0) return undefined;
      return { categoryName: item.name, addons: relatedAddons };
    }
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const errors: string[] = [];
    const seenItems = new Set<number>();
    const menuId = Number(data.menu);
    const addonId = Number(data.addon);

    const menuValid = isAll || menuId;

    const sameAddon = addonIngredients.filter(
      (item) => item.addonId === addonId
    );

    const otherSameForAll = sameAddon.find((item) => !item.menuId);

    const sameMenu = menuId
      ? sameAddon.find((item) => item.menuId === menuId)
      : true;

    if (Boolean((sameAddon && sameMenu) || otherSameForAll))
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
      seenItems.add(ingredient.itemId);
    }
    if (errors.length > 0) {
      return addToast({ title: errors.join("\n"), color: "danger" });
    }
    formData.set("addonIngredient", JSON.stringify(itemIngredients));

    if (!menuValid || !addonId)
      return addToast({ title: "Missing required fields.", color: "danger" });
    setIsSubmitting(true);
    const selectedAddon = addons.find((item) => item.id === addonId);
    const relatedMenuAddonCategory = selectedAddon
      ? await fetchMenuAddonCategoryWithCategoryAndMenu({
          categoryId: selectedAddon.addonCategoryId,
          menuId,
        })
      : null;
      
    if (!relatedMenuAddonCategory) {
      setIsSubmitting(false);
      return addToast({
        title: "This menu is not connected with related add-on category.",
        color: "danger",
      });
    }
    const { isSuccess, message } = await createAddonIngredient(formData);
    setIsSubmitting(false);
    addToast({ title: message, color: isSuccess ? "success" : "danger" });
    if (isSuccess) {
      closeModal();
    }
  };

  return (
    <div className="relative">
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
      >
        <ShortcutButton onPress={() => onOpen()} keys={["ctrl"]} letter="O" />{" "}
        New Addon Ingredient
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
        onClose={() => closeModal()}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create Addon Ingredient
          </ModalHeader>

          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <div className="flex space-x-1">
                <Select label="Select an addon" isRequired name="addon">
                  {addonWithCategory.map((item, index) => (
                    item?<SelectSection key={index} title={item.categoryName}>
                      {item.addons.map((addon) => (
                        <SelectItem key={addon.id}>{addon.name}</SelectItem>
                      ))}
                    </SelectSection>: null
                  ))}
                </Select>
                <Select
                  label="Select a menu"
                  isRequired
                  name="menu"
                  isDisabled={isAll}
                >
                  {menus.map((item) => (
                    <SelectItem key={item.id}>{item.name}</SelectItem>
                  ))}
                </Select>
                <Checkbox size="sm" isSelected={isAll} onValueChange={setIsAll}>
                  All
                </Checkbox>
              </div>
              <h1>Ingredients</h1>
              <div className="space-y-2">
                {itemIngredients && itemIngredients.length
                  ? itemIngredients.map((item) => {
                      const currentWarehouseItem = warehouseItems.find(
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
                            selectedKeys={new Set([String(item.itemId || "")])}
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
                            {warehouseItems.map((wi) => {
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
                            })}
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
                              <RxCross1 />
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
                        return [
                          ...prev,
                          {
                            id: lastItemId + 1,
                            itemId: 0,
                            extraQty: 0,
                            unit: "",
                          },
                        ];
                      })
                    }
                  >
                    <RxPlus />
                  </Button>
                </div>
              ) : null}
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onPress={() => closeModal()}
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
