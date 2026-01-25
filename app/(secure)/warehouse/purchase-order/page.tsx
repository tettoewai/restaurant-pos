import {
  fetchPOItemWithPOIds,
  fetchPurchaseOrder,
  fetchSupplierWithIds,
  fetchWarehouseItemWithIds,
  fetchWarehousesWithIds,
} from "@/app/lib/warehouse/data";
import { CorrectionPOBtn, EditPOButton } from "@/components/Buttons";
import { dateToString } from "@/function";
import { POStatus } from "@prisma/client";
import DeletePOButton from "../components/DeletePOButton";
import POStatusToggle from "../components/POStatusToggle";
import { POTable } from "../components/POTable";

export default async function PurchaseOrderPage() {
  const purchaseOrders = await fetchPurchaseOrder();
  const poIds = purchaseOrders.map((item) => item.id);
  const supplierIds = purchaseOrders.map((item) => item.supplierId);
  const warehouseIds = purchaseOrders.map((item) => item.warehouseId);
  const [purchaseOrderItems, suppliers, warehouses] = await Promise.all([
    fetchPOItemWithPOIds(poIds),
    fetchSupplierWithIds(supplierIds),
    fetchWarehousesWithIds(warehouseIds),
  ]);

  const itemIds = purchaseOrderItems.map((item) => item.itemId);

  const warehouseItems = await fetchWarehouseItemWithIds(itemIds);

  const columns = [
    { key: "code", label: "Code", sortable: true },
    { key: "supplier", label: "Supplier", sortable: true },
    { key: "warehouse", label: "Warehouse", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "createdAt", label: "Created at", sortable: true },
    { key: "action", label: "Action", sortable: false },
  ];

  const rows = purchaseOrders.map((po) => {
    const currentSupplier = suppliers.find((item) => item.id === po.supplierId);
    const currentWarehouse = warehouses.find(
      (item) => item.id === po.warehouseId
    );
    const isDisable = po.status === "RECEIVED" || po.status === "CANCELLED";
    return {
      code: po.code,
      supplier: currentSupplier?.name,
      warehouse: currentWarehouse?.name,
      status: (
        <POStatusToggle poId={po.id} status={po.status} isDisable={isDisable} />
      ),
      createdAt: dateToString({ date: po.createdAt, type: "DMY" }),
      action:
        po.status === POStatus.RECEIVED ? (
          <CorrectionPOBtn item={po} />
        ) : po.status === POStatus.PENDING ? (
          <div className="space-x-2">
            <EditPOButton item={po} />
            <DeletePOButton item={po} />
          </div>
        ) : null,
    };
  });

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Purchase Order(PO)</span>
          <span className="text-sm text-gray-600">
            Manage all your purchase orders(PO). All from a single place easily.
          </span>
        </div>
      </div>
      <div className="mt-4">
        {purchaseOrders.length > 0 ? (
          <POTable
            purchaseOrders={purchaseOrders}
            purchaseOrderItems={purchaseOrderItems}
            warehouseItems={warehouseItems}
            columns={columns}
            rows={rows}
          />
        ) : (
          <span>There is no data.</span>
        )}
      </div>
    </div>
  );
}
