"use client";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/react";

interface Props {
  rows: any;
  columns: any;
}

export default function ListTable({ rows, columns }: Props) {
  return (
    <Table
      aria-label="list table"
      className="rounded-lg bg-background mb-1 min-h-36  p-1 overflow-x-auto"
      removeWrapper
      fullWidth
    >
      <TableHeader>
        {columns.map((column: any) => (
          <TableColumn align="center" key={column.key}>
            {column.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody items={rows} emptyContent={"There is no item"}>
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
