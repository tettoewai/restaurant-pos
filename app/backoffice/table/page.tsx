import { fetchTable } from "@/app/lib/data";
import ItemCard from "@/components/ItemCard";
import NewTableDialog from "@/components/NewTableDailog";

export default async function Table() {
  const tables = await fetchTable();
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Table</span>
          <span className="text-sm text-gray-600">Manage your tables</span>
        </div>
        <NewTableDialog />
      </div>
      <div className="flex flex-wrap mt-2">
        {tables.length > 0 ? (
          tables.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              itemType="table"
              assetUrl={item.assetUrl}
            />
          ))
        ) : (
          <span>There is no table</span>
        )}
      </div>
    </div>
  );
}
