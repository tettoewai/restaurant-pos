"use client";
import {
  Input,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { AuditLog } from "@prisma/client";
import { MinimalisticMagnifer } from "@solar-icons/react/ssr";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo, useState } from "react";

export function AuditLogTable({
  columns,
  rows,
  auditLogs,
}: {
  auditLogs: AuditLog[];
  columns: {
    key: string;
    label: string;
    sortable: boolean;
  }[];
  rows: {
    key: number;
    user: string;
    action: string;
    time: string;
  }[];
}) {
  const router = useRouter();
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set([]));
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
      filteredPO = filteredPO.filter(
        (po) =>
          po.user.toLowerCase().includes(filterValue.toLowerCase()) ||
          po.action.toLowerCase().includes(filterValue.toLowerCase())
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
      <Input
        isClearable
        classNames={{
          base: "w-1/3",
          inputWrapper: "border-1",
        }}
        placeholder="Search by user or action..."
        size="sm"
        startContent={<MinimalisticMagnifer className="text-default-300" />}
        value={filterValue}
        variant="bordered"
        onClear={() => setFilterValue("")}
        onValueChange={onSearchChange}
      />
    );
  }, [filterValue, onSearchChange]);

  const toggleExpand = (key: number) => {
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
        {sortedItems.map((auditLog) => {
          const currentAuditLog = auditLogs.find(
            (item) => item.id === auditLog.key
          );
          const changes: any =
            currentAuditLog && currentAuditLog.changes
              ? currentAuditLog.changes
              : undefined;

          return (
            <Fragment key={auditLog.key}>
              <TableRow
                onClick={() => {
                  if (!changes) return;
                  toggleExpand(auditLog.key);
                }}
                className={`${changes ? "cursor-pointer" : ""}`}
              >
                <TableCell>{auditLog.key}</TableCell>
                <TableCell>{auditLog.user}</TableCell>
                <TableCell>{auditLog.action}</TableCell>
                <TableCell>{auditLog.time}</TableCell>
              </TableRow>
              {expandedKeys.has(auditLog.key) && (
                <TableRow>
                  <TableCell colSpan={4} className="p-0 border-b">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="px-4 pb-4 border-b-1"
                    >
                      <p className="font-semibold">Changes</p>
                      {changes && changes.new && changes.old ? (
                        <>
                          <div>
                            <div className="mt-4">New</div>
                            {JSON.stringify(changes.new)}
                          </div>
                          <div>
                            <div className="mt-4">Old</div>
                            {JSON.stringify(changes.old)}
                          </div>
                        </>
                      ) : null}
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
