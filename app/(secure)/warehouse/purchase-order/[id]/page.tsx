"use client";

import { updatePurchaseOrder } from "@/app/lib/warehouse/action";
import {
  fetchPOItemWithPOId,
  fetchPurchaseOrderWithId,
  fetchSupplier,
  fetchWarehouse,
  fetchWarehouseItem,
} from "@/app/lib/warehouse/data";
import {
  captilize,
  convertBaseUnit,
  convertUnit,
  validUnits,
} from "@/function";
import {
  addToast,
  Button,
  Form,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { AddCircle, CloseCircle } from "@solar-icons/react/ssr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { POItemForm } from "../new/page";

export default function EditPOPage() {
  const param = useParams();
  const poId = Number(param.id);
  const router = useRouter();

  const { data: prevPOData, isLoading: prevPOIsLoading } = useSWR(
    `prevPO-${poId}`,
    () => fetchPurchaseOrderWithId(poId)
  );

  const { data: prevPOItemData, isLoading: prevPOItemIsLoading } = useSWR(
    `prevPOItem-${poId}`,
    () => fetchPOItemWithPOId(poId)
  );

  const { data: suppliers, isLoading: supplierIsLoading } = useSWR(
    `suppliers-${poId}`,
    () => fetchSupplier()
  );
  const { data: warehouses, isLoading: warehouseIsLoading } = useSWR(
    `warehouses-${poId}`,
    () => fetchWarehouse()
  );
  const { data: warehouseItems, isLoading: warehosueItemIsLoading } = useSWR(
    `warehousesItem-${poId}`,
    () => fetchWarehouseItem()
  );

  const [prevPOItems, setPrevPOItems] = useState<POItemForm[]>([
    { id: 1, itemId: 0, quantity: undefined, unit: "", price: undefined },
  ]);

  const [poItems, setPOItems] = useState<POItemForm[]>([
    { id: 1, itemId: 0, quantity: undefined, unit: "", price: undefined },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prevPOItemData) {
      const poItemData = prevPOItemData.map((item, index) => {
        const currentWarehouseItem = warehouseItems?.find(
          (whi) => whi.id === item.itemId
        );
        const unit = currentWarehouseItem?.unit;
        const quantity = unit
          ? convertUnit({ amount: item.quantity, toUnit: unit })
          : 0;
        const price = unit
          ? convertBaseUnit({
              amount: item.unitPrice,
              fromUnit: unit,
            })
          : 0;
        return {
          id: item.id,
          itemId: item.itemId,
          quantity,
          unit: unit ? captilize(unit) : "",
          price,
        };
      });
      setPrevPOItems(poItemData);
      setPOItems(poItemData);
    }
  }, [prevPOItemData, warehouseItems, poId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const errors: string[] = [];
    const seenItems = new Set<number>();
    if (!poId)
      return addToast({ title: "Id is not provided", color: "danger" });
    formData.set("id", String(poId));
    const data = Object.fromEntries(formData);
    const supplierId = Number(data.supplier);
    const warehouseId = Number(data.warehouse);
    const isValid =
      supplierId &&
      typeof supplierId === "number" &&
      warehouseId &&
      typeof warehouseId === "number";
    if (!isValid)
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
    const supplierChange = prevPOData?.supplierId !== supplierId;
    const warehouseChange = prevPOData?.warehouseId !== warehouseId;
    const poItemChange =
      JSON.stringify(poItems) !== JSON.stringify(prevPOItems);
    const nothingChange = !supplierChange && !warehouseChange && !poItemChange;
    if (nothingChange) return router.push("/warehouse/purchase-order");
    formData.set("poItems", JSON.stringify(poItems));
    setIsSubmitting(true);
    const { isSuccess, message } = await updatePurchaseOrder(formData);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      router.push("/warehouse/purchase-order");
    }
    setIsSubmitting(false);
  };

  if (!prevPOData && !prevPOIsLoading) return <div>There is no PO data.</div>;
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Update Purchase Order(PO)</span>
          <span className="text-sm text-gray-600">
            Update your purchase order(PO).
          </span>
        </div>
      </div>
      <div className="flex justify-end mt-2 pr-4">
        <p>Status: {prevPOData ? captilize(prevPOData?.status) : ""}</p>
      </div>
      <Form className="mt-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2 w-full">
          {prevPOIsLoading ? (
            <div className="w-full flex justify-center items-center">
              <Spinner variant="wave" label="PO data is loading..." />
            </div>
          ) : (
            <>
              {supplierIsLoading ? (
                <Spinner variant="wave" label="Supplier loading..." size="sm" />
              ) : (
                <Select
                  label="Select a suppliers"
                  size="sm"
                  isRequired
                  name="supplier"
                  defaultSelectedKeys={
                    new Set([String(prevPOData?.supplierId)])
                  }
                >
                  {suppliers && suppliers.length ? (
                    suppliers.map((item) => (
                      <SelectItem key={item.id}>{item.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem isReadOnly key="none">
                      There is no supplier.
                    </SelectItem>
                  )}
                </Select>
              )}
              {warehouseIsLoading ? (
                <Spinner
                  variant="wave"
                  label="Warehouse loading..."
                  size="sm"
                />
              ) : (
                <Select
                  label="Select a warehouse"
                  size="sm"
                  isRequired
                  name="warehouse"
                  defaultSelectedKeys={
                    new Set([String(prevPOData?.warehouseId)])
                  }
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
              )}
            </>
          )}
        </div>
        <div className="mt-4 w-full">
          <h1 className="ml-3">Purchase Order Item</h1>
          {prevPOItemIsLoading ? (
            <div className="w-full flex justify-center items-center">
              <Spinner variant="wave" label="PO item data is loading..." />
            </div>
          ) : (
            <>
              {poItems.map((poItem) => {
                const currentWarehouseItem = warehouseItems?.find(
                  (item) => item.id === poItem.itemId
                );
                const units = currentWarehouseItem
                  ? validUnits(currentWarehouseItem.unitCategory)
                  : [""];
                return (
                  <div key={poItem.id} className="flex space-x-1 mt-3">
                    {warehosueItemIsLoading ? (
                      <Spinner
                        variant="wave"
                        label="Item loading..."
                        size="sm"
                      />
                    ) : (
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
                              poItems.find(
                                (poItem) => poItem.itemId === item.id
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
                            There is no item.
                          </SelectItem>
                        )}
                      </Select>
                    )}
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
                          className="bg-transparent"
                          value={
                            poItem.unit ? captilize(String(poItem.unit)) : ""
                          }
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
                          <option className="hidden" key=""></option>
                          {units.map((item) => (
                            <option key={item}>{item}</option>
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
                    onPress={() =>
                      router.push("/warehouse/purchase-order")
                    }
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
                      <span>Update</span>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Form>
    </div>
  );
}
