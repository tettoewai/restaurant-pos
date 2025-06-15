export const revalidate = 3600;

import { Card } from "@heroui/react";
import { LiaWarehouseSolid } from "react-icons/lia";
import { fetchSelectedWarehouse, fetchWarehouse } from "../lib/warehouse/data";
import WarehouoseToggle from "./components/WarehouseToggle";

export default async function WarehousePage() {
  const [warehouse, selectedWarehouse] = await Promise.all([
    fetchWarehouse(),
    fetchSelectedWarehouse(),
  ]);

  if (!warehouse || !warehouse.length || !selectedWarehouse)
    return <div>There is no warehouse.</div>;
  return (
    <div>
      <div className="flex flex-col">
        <span className="text-primary">Warehouse</span>
        <span className="text-sm text-gray-600">Store smartly</span>
      </div>
      <div className="mt-5">
        <Card
          fullWidth
          className="flex justify-between flex-row items-center p-2 bg-background h-14 pr-4"
        >
          <div className="flex">
            <LiaWarehouseSolid className="size-6 text-primary mr-2 items-center justify-center" />
            <span>Warehouse</span>
          </div>
          <WarehouoseToggle
            warehouse={warehouse}
            selectedWarehouse={selectedWarehouse}
          />
        </Card>
      </div>
      <div className="flex flex-col mt-5">
        <span className="text-primary">Dashboard</span>
        <span className="text-sm text-gray-600">Track your movement</span>
      </div>
      <div>Dashboard goes here</div>
    </div>
  );
}
