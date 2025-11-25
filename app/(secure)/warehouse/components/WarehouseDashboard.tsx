import { fetchDashboardData } from "@/app/lib/warehouse/data";
import {
  captilize,
  convertUnit,
  dateToString,
  roundToTwoDecimal,
} from "@/function";
import { Card, Chip } from "@heroui/react";
import { POStatus } from "@prisma/client";
import {
  BoxMinimalistic,
  Cart,
  DangerTriangle,
  SquareTransferHorizontal,
} from "@solar-icons/react/ssr";
import Link from "next/link";

export const revalidate = 60;

export default async function WarehouseDashboard() {
  const dashboardData = await fetchDashboardData();

  const stats = [
    {
      name: "Total Stock Items",
      value: dashboardData.totalStockItems,
      icon: <BoxMinimalistic className="size-6" />,
      color: "bg-blue-500",
    },
    {
      name: "Low Stock Items",
      value: dashboardData.lowStockItems,
      icon: <DangerTriangle className="size-6" />,
      color: "bg-red-500",
    },
    {
      name: "Pending Purchase Orders",
      value: dashboardData.pendingPOs,
      icon: <Cart className="size-6" />,
      color: "bg-orange-500",
    },
    {
      name: "Recent Movements",
      value: dashboardData.recentMovements.length,
      icon: <SquareTransferHorizontal className="size-6" />,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-background/60 flex flex-col p-4 rounded-xl border border-default-100 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground/70">
                {stat.name}
              </h3>
              <Card
                shadow="none"
                className={`${stat.color} text-white p-2 rounded-lg size-10 flex items-center justify-center`}
              >
                {stat.icon}
              </Card>
            </div>
            <h1 className="text-3xl font-semibold text-primary">
              {stat.value}
            </h1>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items Alert */}
        <Card className="bg-background/60 p-4 rounded-xl border border-default-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Low Stock Alerts
              </h2>
              <p className="text-sm text-foreground/60">
                Items below threshold
              </p>
            </div>
            <DangerTriangle className="size-6 text-red-500" />
          </div>
          {dashboardData.lowStockItemsList.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboardData.lowStockItemsList.map((item) => {
                const quantity = roundToTwoDecimal(
                  convertUnit({
                    amount: item.quantity,
                    toUnit: item.unit,
                  })
                );
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-foreground/60">
                        {quantity} {captilize(item.unit)} / Threshold:{" "}
                        {roundToTwoDecimal(
                          convertUnit({
                            amount: item.threshold,
                            toUnit: item.unit,
                          })
                        )}{" "}
                        {captilize(item.unit)}
                      </p>
                    </div>
                    <Chip color="danger" size="sm" variant="flat">
                      Low
                    </Chip>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-foreground/60 text-center py-4">
              No low stock items
            </p>
          )}
        </Card>

        {/* Recent Purchase Orders */}
        <Card className="bg-background/60 p-4 rounded-xl border border-default-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent Purchase Orders
              </h2>
              <p className="text-sm text-foreground/60">Last 5 orders</p>
            </div>
          </div>
          {dashboardData.recentPOs.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboardData.recentPOs.map((po) => (
                <Link
                  key={po.id}
                  href={`/warehouse/purchase-order/${po.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-2 rounded-lg border hover:border-primary">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{po.code}</p>
                      <p className="text-xs text-foreground/60">
                        {po.supplier.name} •{" "}
                        {dateToString({ date: po.createdAt, type: "DMY" })}
                      </p>
                    </div>
                    <Chip
                      color={
                        po.status === POStatus.PENDING
                          ? "warning"
                          : po.status === POStatus.RECEIVED
                          ? "success"
                          : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {captilize(po.status)}
                    </Chip>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/60 text-center py-4">
              No purchase orders yet
            </p>
          )}
        </Card>
      </div>

      {/* Recent Stock Movements */}
      <Card className="bg-background/60 p-4 rounded-xl border border-default-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Stock Movements
            </h2>
            <p className="text-sm text-foreground/60">Last 10 movements</p>
          </div>
          <Link
            href="/warehouse/stock-movement"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        {dashboardData.recentMovements.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {dashboardData.recentMovements.map((movement) => {
              const quantity = roundToTwoDecimal(
                convertUnit({
                  amount: movement.quantity,
                  toUnit: movement.warehouseItem.unit,
                })
              );
              return (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {movement.warehouseItem.name}
                      </p>
                      <Chip
                        color={movement.type === "IN" ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {movement.type}
                      </Chip>
                    </div>
                    <p className="text-xs text-foreground/60">
                      {quantity} {captilize(movement.warehouseItem.unit)} •{" "}
                      {movement.reference || "N/A"} •{" "}
                      {dateToString({
                        date: movement.createdAt,
                        type: "DMY",
                        withHour: true,
                      })}
                    </p>
                    {movement.note && (
                      <p className="text-xs text-foreground/50 mt-1">
                        {movement.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-foreground/60 text-center py-4">
            No stock movements yet
          </p>
        )}
      </Card>
    </div>
  );
}
