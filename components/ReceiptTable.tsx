"use client";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Input,
  SortDescriptor,
} from "@heroui/react";
import { useCallback, useMemo, useState } from "react";
import { BiSearch } from "react-icons/bi";

interface Props {
  rows: any;
  columns: any;
}

export default function ReceiptTable({ rows, columns }: Props) {
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
    let filteredReceipt = [...rows];

    if (hasSearchFilter) {
      filteredReceipt = filteredReceipt.filter((receipt) =>
        receipt.code.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredReceipt;
  }, [rows, filterValue, hasSearchFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = sortDescriptor.column && a[sortDescriptor.column];
      const second = sortDescriptor.column && b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const topContent = useMemo(() => {
    return (
      <div className="flex w-full justify-end">
        <Input
          isClearable
          classNames={{
            base: "w-1/3",
            inputWrapper: "border-1",
          }}
          placeholder="Search by code..."
          size="sm"
          startContent={<BiSearch className="text-default-300" />}
          value={filterValue}
          variant="bordered"
          onClear={() => setFilterValue("")}
          onValueChange={onSearchChange}
        />
      </div>
    );
  }, [filterValue, onSearchChange]);
  return (
    <Table
      aria-label="list table"
      className="rounded-lg bg-background mb-1 min-h-36  p-1 overflow-x-auto"
      removeWrapper
      isCompact
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      fullWidth
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader>
        {columns.map((column: any) => (
          <TableColumn
            align="center"
            key={column.key}
            allowsSorting={column.sortable}
          >
            {column.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody items={sortedItems} emptyContent={"There is no item"}>
        {(item: any) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell align="center">
                {getKeyValue(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
