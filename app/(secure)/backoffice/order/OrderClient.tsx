"use client";

import { fetchOrder, fetchTableWithIds } from "@/app/lib/backoffice/data";
import TableIcon from "@/components/icons/TableIcon";
import { timeAgo } from "@/function";
import { Card, Chip, Spinner } from "@heroui/react";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import useSWR from "swr";

const OrderClient = () => {
  const { data: order, isLoading: orderIsLoading } = useSWR(
    "order",
    () => fetchOrder(),
    {
      refreshInterval: 5000,
    }
  );

  const tableId =
    order && order.sort((a, b) => a.id - b.id).map((item) => item.tableId);

  const { data: tables, isLoading: tableIsLoading } = useSWR(
    tableId ? `table - ${[tableId]}` : null,
    () => tableId && fetchTableWithIds(tableId)
  );

  const uniqueTable = Array.from(new Set(tableId));

  if (orderIsLoading || tableIsLoading)
    return (
      <div className="w-full h-80 flex justify-center items-center">
        <Spinner
          variant="wave"
          label={`${orderIsLoading ? "Order" : "Table"} is loading ...`}
        />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Order</span>
        <span className="text-sm text-gray-600">Manage your order</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-1 mt-4">
        {order && order.length > 0 ? (
          uniqueTable.map((tableId) => {
            const validTable = tables?.find((item) => item.id === tableId);
            const firstOrder = order
              .filter((item) => item.status === OrderStatus.PENDING)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
            return (
              <Link key={tableId} href={`/backoffice/order/${tableId}`}>
                <Card className="w-40 h-40 bg-background p-2">
                  <div className="w-full flex justify-end">
                    {firstOrder ? (
                      <Chip variant="faded">
                        {timeAgo(firstOrder.createdAt)}
                      </Chip>
                    ) : null}
                  </div>
                  <div className="w-full flex items-center justify-center h-3/5">
                    <TableIcon className="size-14" />
                  </div>
                  <div className="w-full flex items-center justify-center">
                    <span>{validTable?.name}</span>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <div>There is no order yet</div>
        )}
      </div>
    </div>
  );
};

export default OrderClient;
