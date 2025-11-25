"use client";
import { createPurchaseOrder } from "@/app/lib/warehouse/action";
import { captilize, validUnits } from "@/function";
import {
  addToast,
  Button,
  Form,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { Supplier, Warehouse, WarehouseItem } from "@prisma/client";
import { AddCircle, CloseCircle } from "@solar-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";

export interface POItemForm {
  id: number;
  itemId: number;
  quantity: number | undefined;
  unit: string;
  price: number | undefined;
}

export default function NewPurchaseOrderForm({
  suppliers,
  warehouses,
  warehouseItems,
}: {
  suppliers: Supplier[];
  warehouses: Warehouse[];
  warehouseItems: WarehouseItem[];
}) {
  const router = useRouter();

  const [poItems, setPOItems] = useState<POItemForm[]>([
    { id: 1, itemId: 0, quantity: undefined, unit: "", price: undefined },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select warehouse if there's only one
  const defaultWarehouseId = useMemo(() => {
    if (warehouses && warehouses.length === 1) {
      return String(warehouses[0].id);
    }
    return null;
  }, [warehouses]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    defaultWarehouseId
  );

  // Update selected warehouse when default changes
  useEffect(() => {
    if (defaultWarehouseId) {
      setSelectedWarehouseId(defaultWarehouseId);
    }
  }, [defaultWarehouseId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const errors: string[] = [];
    const seenItems = new Set<number>();
    const data = Object.fromEntries(formData);
    const supplierId = Number(data.supplier);
    const warehouseId = Number(data.warehouse);
    const idIsValid =
      supplierId &&
      typeof supplierId === "number" &&
      warehouseId &&
      typeof warehouseId === "number";
    if (!idIsValid)
      return addToast({
        title: "Missing supplier id or warehouse id!",
        color: "danger",
      });

    for (const poItem of poItems) {
      if (!poItem.itemId || poItem.itemId === 0) {
        errors.push("Each PO item must have an item selected.");
      }
      if (!poItem.unit || poItem.unit === "") {
        errors.push("Each PO item must have a unit.");
      }
      if (poItem.quantity && poItem.quantity <= 0) {
        errors.push("PO item qauantity must be grater than 0.");
      }
      if (poItem.price && poItem.price <= 0) {
        errors.push("PO item price must be grater than 0.");
      }
      if (seenItems.has(poItem.itemId)) {
        errors.push("Duplicate items are not allowed.");
      }
      seenItems.add(poItem.itemId);
    }
    if (errors.length > 0) {
      return addToast({ title: errors.join("\n"), color: "danger" });
    }
    formData.set("poItems", JSON.stringify(poItems));
    setIsSubmitting(true);
    const { isSuccess, message } = await createPurchaseOrder(formData);
    setIsSubmitting(false);
    addToast({ title: message, color: isSuccess ? "success" : "danger" });
    if (isSuccess) {
      router.push("/warehouse/purchase-order");
    }
  };
  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      <div className="flex space-x-2 w-full">
        <Select label="Select a suppliers" size="sm" isRequired name="supplier">
          {suppliers && suppliers.length ? (
            suppliers.map((item) => (
              <SelectItem key={item.id}>{item.name}</SelectItem>
            ))
          ) : (
            <SelectItem key="none" isReadOnly>
              There is no supplier
            </SelectItem>
          )}
        </Select>
        <Select
          label="Select a warehouse"
          size="sm"
          isRequired
          name="warehouse"
          selectedKeys={
            selectedWarehouseId ? new Set([selectedWarehouseId]) : undefined
          }
          onSelectionChange={(e) => {
            const value = Array.from(e)[0] as string;
            setSelectedWarehouseId(value);
          }}
        >
          {warehouses && warehouses.length ? (
            warehouses.map((item) => (
              <SelectItem key={item.id}>{item.name}</SelectItem>
            ))
          ) : (
            <SelectItem isReadOnly key="none">
              There is no warehouse.
            </SelectItem>
          )}
        </Select>
      </div>
      <div className="mt-4 w-full">
        <h1 className="ml-3">Purchase Order Item</h1>
        {poItems.map((poItem) => {
          const currentWarehouseItem = warehouseItems?.find(
            (item) => item.id === poItem.itemId
          );
          const units = currentWarehouseItem
            ? validUnits(currentWarehouseItem.unitCategory)
            : [""];
          return (
            <div key={poItem.id} className="flex space-x-1 mt-3">
              <Select
                label="Select a item"
                size="sm"
                isRequired
                selectedKeys={new Set([String(poItem.itemId)])}
                onSelectionChange={(e) => {
                  const value = Number(Array.from(e)[0]);
                  setPOItems((prev) =>
                    prev.map((item) => {
                      if (item.id === poItem.id) {
                        return { ...item, itemId: value };
                      } else return item;
                    })
                  );
                }}
              >
                {warehouseItems && warehouseItems.length ? (
                  warehouseItems.map((item) => {
                    const alreadySelected = Boolean(
                      poItems.find((poItem) => poItem.itemId === item.id)
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
                    There is no item.
                  </SelectItem>
                )}
              </Select>
              <NumberInput
                label="Quantity"
                isRequired
                minValue={0}
                size="sm"
                value={poItem.quantity}
                onValueChange={(e) =>
                  setPOItems((prev) =>
                    prev.map((item) => {
                      if (item.id === poItem.id) {
                        return { ...item, quantity: Number(e) };
                      } else return item;
                    })
                  )
                }
                endContent={
                  <select
                    required
                    className="bg-transparent text-foreground border-none outline-none cursor-pointer px-2 py-1 rounded-sm w-fit appearance-none focus:outline-none focus:ring-0 hover:bg-default-100 dark:hover:bg-default-50 transition-colors text-sm font-normal"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.25rem center",
                      backgroundSize: "1em 1em",
                      paddingRight: "1.5rem",
                      color: "inherit",
                    }}
                    value={poItem.unit ? captilize(String(poItem.unit)) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPOItems((prev) =>
                        prev.map((item) => {
                          if (item.id === poItem.id) {
                            return { ...item, unit: value };
                          } else return item;
                        })
                      );
                    }}
                  >
                    <option
                      value=""
                      disabled
                      className="bg-background text-foreground"
                    >
                      Select
                    </option>
                    {units.map((item) => (
                      <option
                        key={item}
                        value={item}
                        className="bg-background text-foreground dark:bg-gray-800 dark:text-white"
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                }
              />
              <NumberInput
                label="Price per unit"
                isRequired
                size="sm"
                value={poItem.price}
                minValue={0}
                onValueChange={(e) =>
                  setPOItems((prev) =>
                    prev.map((item) => {
                      if (item.id === poItem.id) {
                        return { ...item, price: Number(e) };
                      } else return item;
                    })
                  )
                }
              />
              {poItems.length > 1 ? (
                <Button
                  isIconOnly
                  color="primary"
                  variant="light"
                  onPress={() =>
                    setPOItems((prev) =>
                      prev.filter((item) => poItem.id !== item.id)
                    )
                  }
                >
                  <CloseCircle />
                </Button>
              ) : null}
            </div>
          );
        })}
        {warehouseItems && warehouseItems.length !== poItems.length ? (
          <div className="w-full flex justify-center items-center mt-3">
            <Button
              isIconOnly
              variant="ghost"
              color="primary"
              onPress={() =>
                setPOItems((prev) => {
                  const lastItemId = poItems[poItems.length - 1].id;
                  return [
                    ...prev,
                    {
                      id: lastItemId + 1,
                      itemId: 0,
                      quantity: undefined,
                      unit: "",
                      price: undefined,
                    },
                  ];
                })
              }
            >
              <AddCircle />
            </Button>
          </div>
        ) : null}
        <div className="flex justify-end mt-4">
          <div>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={() => router.push("/warehouse/purchase-order")}
              isDisabled={isSubmitting}
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
                <span>Create</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}
