"use client";

import { fetchOrder, fetchTableWithIds } from "@/app/lib/backoffice/data";
import TableIcon from "@/components/icons/TableIcon";
import { timeAgo } from "@/function";
import { Card, Chip, Spinner } from "@heroui/react";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";

const OrderClient = () => {
  const { channel } = useSocket();
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const orderData = await fetchOrder();
        setOrders(orderData);
        if (orderData.length > 0) {
          const tableIds = Array.from(new Set(orderData.map((item: any) => item.tableId)));
          const tableData = await fetchTableWithIds(tableIds);
          setTables(tableData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!channel) return;

    const handleOrderChange = async (payload: any) => {
      // Refresh orders on any order table change
      const updatedOrders = await fetchOrder();
      setOrders(updatedOrders);
      // Update tables if needed
      const tableIds = Array.from(new Set(updatedOrders.map((item: any) => item.tableId)));
      const tableData = await fetchTableWithIds(tableIds);
      setTables(tableData);
    };

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'order' }, handleOrderChange);

    return () => {
      // No specific off method, channel will be unsubscribed in useEffect cleanup
    };
  }, [channel]);

  const tableIds = orders.sort((a, b) => a.id - b.id).map((item) => item.tableId);
  const uniqueTable = Array.from(new Set(tableIds));

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
          uniqueTable.map((tableId) => {
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
