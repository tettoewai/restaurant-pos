import {
  fetchStockMovement,
  fetchWarehouseItemWithIds,
  fetchWarehousesWithIds,
} from "@/app/lib/warehouse/data";
import MyTable from "@/components/MyTable";
import { captilize, convertUnit, roundToTwoDecimal } from "@/function";

export default async function StockMovementPage() {
  const stockMovements = await fetchStockMovement();
  const warehouseItemIds = stockMovements.map((item) => item.itemId);
  const warehouseIds = stockMovements.map((item) => item.warehouseId);

  const [warehouseItems, warehouses] = await Promise.all([
    fetchWarehouseItemWithIds(warehouseItemIds),
    fetchWarehousesWithIds(warehouseIds),
  ]);

  const columns = [
    { key: "key", label: "No.", sortable: true },
    { key: "product", label: "Product", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "reference", label: "Reference", sortable: true },
    { key: "note", label: "Note" },
    { key: "warehouse", label: "Warehouse" },
    { key: "source", label: "Source" },
  ];

  const rows = stockMovements.map((stockMovement, index) => {
    const currentItem = warehouseItems.find(
      (item) => item.id === stockMovement.itemId
    );
    const currentWarehoue = warehouses.find(
      (item) => item.id === stockMovement.warehouseId
    );
    const quantity = currentItem
      ? roundToTwoDecimal(
          convertUnit({
            amount: stockMovement.quantity,
            toUnit: currentItem.unit,
          })
        )
      : 0;
    return {
      key: index + 1,
      product: currentItem?.name,
      type: captilize(stockMovement.type),
      quantity: `${quantity} ${currentItem ? captilize(currentItem.unit) : ""}`,
      reference: stockMovement.reference,
      note: stockMovement.note,
      warehouse: currentWarehoue?.name,
      source: captilize(stockMovement.source).replace("_", " "),
    };
  });

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Stock Movement</span>
        <span className="text-sm text-gray-600">
          Review every movement of stock.
        </span>
      </div>
      <div className="mt-2">
        <MyTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}
