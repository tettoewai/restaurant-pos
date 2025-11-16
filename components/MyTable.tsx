"use client";
import {
  getKeyValue,
  Input,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { MinimalisticMagnifer } from "@solar-icons/react/ssr";
import { useCallback, useMemo, useState } from "react";

interface Props {
  rows: any;
  columns: any;
  searchable?: boolean;
}

export default function MyTable({ rows, columns, searchable }: Props) {
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
          startContent={<MinimalisticMagnifer className="text-default-300" />}
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
      className="rounded-lg mb-1 p-1"
      classNames={{
        base: "max-h-[520px]",
      }}
      removeWrapper
      isCompact
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      fullWidth
      topContent={searchable ? topContent : null}
      topContentPlacement="outside"
      isHeaderSticky
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
          <TableRow key={item.key} className="mb-2">
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
