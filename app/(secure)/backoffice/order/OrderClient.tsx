"use client";

import { fetchOrder, fetchTableWithIds } from "@/app/lib/backoffice/data";
import TableIcon from "@/components/icons/TableIcon";
import { timeAgo } from "@/function";
import { Card, Chip, Spinner } from "@heroui/react";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSocket } from "@/context/SocketContext";
import useSWR, { mutate } from "swr";

const OrderClient = () => {
  const { channel, isConnected } = useSocket();

  // Use SWR for real-time polling with refreshInterval
  const { data: orders = [], isLoading: orderIsLoading } = useSWR(
    "backoffice-orders",
    fetchOrder,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch tables when orders are available
  const tableIds = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return Array.from(new Set(orders.map((item: any) => item.tableId)));
  }, [orders]);

  const { data: tables = [], isLoading: tableIsLoading } = useSWR(
    tableIds.length > 0 ? ["backoffice-tables", tableIds] : null,
    () => fetchTableWithIds(tableIds),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Also listen to real-time changes via socket for immediate updates
  useEffect(() => {
    if (!channel || !isConnected) return;

    const handleOrderChange = async (payload: any) => {
      // Trigger SWR revalidation on real-time changes for immediate updates
      mutate("backoffice-orders");
      if (tableIds.length > 0) {
        mutate(["backoffice-tables", tableIds]);
      }
    };

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'order' }, handleOrderChange);

    return () => {
      // Cleanup is handled by channel unsubscribe in SocketContext
      // The channel.on() listeners are automatically cleaned up when channel is unsubscribed
    };
  }, [channel, isConnected, tableIds]);

  const sortedTableIds = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders
      .sort((a, b) => a.id - b.id)
      .map((item) => item.tableId);
  }, [orders]);

  const uniqueTable = Array.from(new Set(sortedTableIds));
  const isLoading = orderIsLoading || tableIsLoading;

  if (isLoading)
    return (
      <div className="w-full h-80 flex justify-center items-center">
        <Spinner variant="wave" label="Loading orders..." />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Order</span>
        <span className="text-sm text-gray-600">Manage your order</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-1 mt-4">
        {orders && orders.length > 0 ? (
          uniqueTable.map((tableId: number) => {
            const validTable = tables?.find((item) => item.id === tableId);
            const firstOrder = orders
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
