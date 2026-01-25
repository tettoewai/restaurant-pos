"use client";

import { Table } from "@prisma/client";
import { useState } from "react";
import ItemCard from "./ItemCard";
import UpdateTableDialog from "./UpdateTableDailog";
import { useDisclosure } from "@heroui/react";

interface Props {
  tables: Table[];
  orders: Array<{ tableId: number }>;
}

export default function TableList({ tables, orders }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setSelectedId(id);
    onOpen();
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 mt-2">
        {tables.length > 0 ? (
          tables.map((item) => {
            const isActive = Boolean(
              orders.find((order) => order.tableId === item.id)
            );
            return (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                itemType="table"
                isActive={isActive}
                onEditTable={handleEdit}
              />
            );
          })
        ) : (
          <span>There is no table</span>
        )}
      </div>
      {selectedId !== null && (
        <UpdateTableDialog
          key={selectedId}
          id={selectedId}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onClose={handleClose}
        />
      )}
    </>
  );
}
