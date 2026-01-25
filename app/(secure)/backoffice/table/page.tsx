import { fetchTable } from "@/app/lib/backoffice/data";
import { fetchActiveOrderWithTableIds } from "@/app/lib/order/data";
import TableList from "@/components/TableList";
import NewTableDialog from "@/components/NewTableDailog";
import { baseMetadata } from "@/app/lib/baseMetadata";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Table | ${baseMetadata.title}`,
};

export default async function Table() {
  const tables = await fetchTable();
  const orders = await fetchActiveOrderWithTableIds(
    tables.map((item) => item.id)
  );
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Table</span>
          <span className="text-sm text-gray-600">Manage your tables</span>
        </div>
        <NewTableDialog />
      </div>
      <TableList tables={tables} orders={orders} />
    </div>
  );
}
