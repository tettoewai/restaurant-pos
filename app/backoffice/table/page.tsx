import { fetchTable } from "@/app/lib/backoffice/data";
import { fetchActiveOrderWithTableIds } from "@/app/lib/order/data";
import ItemCard from "@/components/ItemCard";
import NewTableDialog from "@/components/NewTableDailog";

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
              />
            );
          })
        ) : (
          <span>There is no table</span>
        )}
      </div>
    </div>
  );
}
