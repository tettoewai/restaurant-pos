import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/react";

interface Props {
  rows: any;
  columns: any;
}

export default function ListTable({ rows, columns }: Props) {
  return (
    <Table
      aria-label="list table"
      className="bg-background rounded-lg p-2 min-h-36"
      removeWrapper
    >
      <TableHeader>
        {columns.map((column: any) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody items={rows} emptyContent={"There is no menu"}>
        {(item: any) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}