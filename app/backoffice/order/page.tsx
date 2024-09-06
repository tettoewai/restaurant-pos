import { fetchOrder, fetchTableWithIds } from "@/app/lib/backoffice/data";
import { Card } from "@nextui-org/react";
import Link from "next/link";
import { MdTableBar } from "react-icons/md";

const Order = async () => {
  const order = await fetchOrder();
  const tableId = order.map((item) => item.tableId);
  const tables = await fetchTableWithIds(tableId);
  const uniqueTable = Array.from(new Set(tableId));
  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Order</span>
        <span className="text-sm text-gray-600">Manage your order</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-1 mt-4">
        {order.length > 0 ? (
          uniqueTable.map((tableId) => {
            const validTable = tables.find((item) => item.id === tableId);
            return (
              <Link key={tableId} href={`/backoffice/order/${tableId}`}>
                <Card className="w-40 h-40">
                  <div className="w-full flex items-center justify-center h-3/5">
                    <MdTableBar className="size-10 mb-1 text-primary" />
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
export default Order;
