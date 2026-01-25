"use client";
import ShortcutButton from "@/components/ShortCut";
import {
  captilize,
  convertBaseUnit,
  convertUnit,
  roundToTwoDecimal,
} from "@/function";
import {
  Button,
  Input,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  PurchaseOrder,
  PurchaseOrderItem,
  WarehouseItem,
} from "@prisma/client";
import { MinimalisticMagnifer } from "@solar-icons/react/ssr";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo, useState } from "react";

export function POTable({
  purchaseOrders,
  purchaseOrderItems,
  warehouseItems,
  rows,
  columns,
}: {
  purchaseOrders: PurchaseOrder[];
  purchaseOrderItems: PurchaseOrderItem[];
  warehouseItems: WarehouseItem[];
  columns: {
    key: string;
    label: string;
    sortable: boolean;
  }[];
  rows: {
    code: string;
    supplier: string | undefined;
    warehouse: string | undefined;
    status: JSX.Element;
    createdAt: string;
    action: JSX.Element | null;
  }[];
}) {
  const router = useRouter();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set([]));
  const [filterValue, setFilterValue] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "key",
    direction: "ascending",
  });

  const hasSearchFilter = Boolean(filterValue);

  const onSearchChange = useCallback((value: any) => {
    if (value) {
      setFilterValue(value);
    } else {
      setFilterValue("");
    }
  }, []);

  const filteredItems = useMemo(() => {
    let filteredPO = [...rows];

    if (hasSearchFilter) {
      filteredPO = filteredPO.filter((po) =>
        po.code.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredPO;
  }, [rows, filterValue, hasSearchFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: any, b: any) => {
      const first = sortDescriptor.column && a[sortDescriptor.column];
      const second = sortDescriptor.column && b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const topContent = useMemo(() => {
    return (
      <div className="flex w-full justify-between items-center">
        <Input
          isClearable
          classNames={{
            base: "w-1/3",
            inputWrapper: "border-1",
          }}
          placeholder="Search by code..."
          size="sm"
          startContent={<MinimalisticMagnifer className="text-default-300" />}
          value={filterValue}
          variant="bordered"
          onClear={() => setFilterValue("")}
          onValueChange={onSearchChange}
        />
        <Button
          onPress={() => {
            router.push("/warehouse/purchase-order/new");
          }}
          className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 m-2 rounded"
        >
          <ShortcutButton
            onPress={() => {
              router.push("/warehouse/purchase-order/new");
            }}
            keys={["ctrl"]}
            letter="O"
          />
          New Purchase Order
        </Button>
      </div>
    );
  }, [filterValue, onSearchChange, router]);

  const toggleExpand = (key: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key);
    } else {
      newExpandedKeys.add(key);
    }
    setExpandedKeys(newExpandedKeys);
  };

  return (
    <Table
      aria-label="Purchase Order Table"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      fullWidth
      topContent={topContent}
      removeWrapper
    >
      <TableHeader>
        {columns.map((item) => (
          <TableColumn allowsSorting={item.sortable} key={item.key}>
            {item.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {sortedItems.map((po) => {
          const currentPO = purchaseOrders.find(
            (item) => item.code === po.code
          );
          return (
            <Fragment key={po.code}>
              <TableRow
                onClick={() => toggleExpand(po.code)}
                className="cursor-pointer"
              >
                <TableCell>
                  {po.code} {currentPO?.isEdited ? " (edited)" : ""}
                </TableCell>
                <TableCell>{po.supplier}</TableCell>
                <TableCell>{po.warehouse}</TableCell>
                <TableCell>{po.status}</TableCell>
                <TableCell>{po.createdAt}</TableCell>
                <TableCell>{po.action}</TableCell>
              </TableRow>
              {expandedKeys.has(po.code) && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 border-b">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="px-4 pb-4 border-b-1"
                    >
                      <p className="font-semibold">Purchase order items</p>
                      <div className="mt-4">
                        <Table
                          aria-label="Purchase Order Item"
                          removeWrapper
                          isCompact
                        >
                          <TableHeader>
                            <TableColumn>Item</TableColumn>
                            <TableColumn>Qty</TableColumn>
                            <TableColumn>Price</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {purchaseOrderItems
                              .filter(
                                (item) => item.purchaseOrderId === currentPO?.id
                              )
                              .map((poi) => {
                                const currentItem = warehouseItems.find(
                                  (item) => item.id === poi.itemId
                                );
                                const unit = currentItem?.unit;
                                const quantity = unit
                                  ? convertUnit({
                                    amount: poi.quantity,
                                    toUnit: unit,
                                  })
                                  : 0;

                                const price = unit
                                  ? convertBaseUnit({
                                    amount: poi.unitPrice,
                                    fromUnit: unit,
                                  })
                                  : 0;
                                return (
                                  <TableRow key={poi.id}>
                                    <TableCell>{currentItem?.name}</TableCell>
                                    <TableCell>{`${roundToTwoDecimal(
                                      quantity
                                    )} ${captilize(unit || "")}`}</TableCell>
                                    <TableCell>
                                      {roundToTwoDecimal(price)} Ks
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </motion.div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
