"use client";
import {
  calculateFoodCost,
  calculateInventoryVariance,
  fetchMenuWithIds,
  getOrderWithDate,
  getReceiptsWithDate,
} from "@/app/lib/backoffice/data";
import { DashboardCardSkeleton } from "@/app/ui/skeletons";
import { formatCurrency } from "@/function";
import { Card, DateRangePicker } from "@heroui/react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { OrderStatus, Receipt } from "@prisma/client";
import { useDateFormatter } from "@react-aria/i18n";
import {
  Chart,
  ClockCircle,
  GraphDown,
  GraphUp,
  HandMoney,
  Shop,
  Tag,
} from "@solar-icons/react/ssr";
import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import DashboardCard from "./DashboardCard";
import ExportToExcelBtn from "./ExportToExcelBtn";

interface FinancialMetricsProps {
  date?: {
    start: ReturnType<typeof parseDate>;
    end: ReturnType<typeof parseDate>;
  };
}

function FinancialMetrics({ date: propDate }: FinancialMetricsProps = {}) {
  const iconClass = "text-white size-6";
  const nowDate = new Date();
  const today = nowDate.toISOString().split("T")[0];
  const [date, setDate] = useState(
    propDate || {
      start: parseDate(today),
      end: parseDate(today),
    }
  );
  let formatter = useDateFormatter({ dateStyle: "long" });

  // Use state to prevent hydration mismatch with localStorage
  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize localStorage value after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
  }, []);

  // Listen for storage changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isUpdateLocation") {
        setIsUpdateLocation(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  // Sync with propDate if provided
  useEffect(() => {
    if (propDate) {
      setDate(propDate);
    }
  }, [propDate]);

  const { data: orderData, isLoading } = useSWR(
    mounted ? ["financialOrderData", date, isUpdateLocation] : null,
    () =>
      getOrderWithDate(
        date.start.toDate(getLocalTimeZone()),
        date.end.toDate(getLocalTimeZone())
      ),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: receipts, isLoading: receiptsLoading } = useSWR(
    mounted ? ["financialReceipts", date, isUpdateLocation] : null,
    () =>
      getReceiptsWithDate(
        date.start.toDate(getLocalTimeZone()),
        date.end.toDate(getLocalTimeZone())
      )
  );

  const { data: foodCost, isLoading: foodCostLoading } = useSWR(
    mounted ? ["foodCost", date, isUpdateLocation] : null,
    () =>
      calculateFoodCost(
        date.start.toDate(getLocalTimeZone()),
        date.end.toDate(getLocalTimeZone())
      )
  );

  const { data: inventoryVariance, isLoading: inventoryVarianceLoading } =
    useSWR(
      mounted ? ["inventoryVariance", isUpdateLocation] : null,
      () => calculateInventoryVariance(),
      {
        refreshInterval: 30000, // Refresh every 30 seconds
      }
    );

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!orderData || !receipts) {
      return null;
    }

    // Use real food cost if available, otherwise 0
    const totalFoodCost = foodCost || 0;

    const paidOrders = orderData.filter(
      (item) => !item.isFoc && item.status === OrderStatus.PAID
    );
    const canceledOrders = orderData.filter(
      (item) => item.status === OrderStatus.CANCELED
    );

    // Revenue calculations
    const grossRevenue =
      paidOrders.reduce((acc, cur) => {
        const totalPrice = Number(cur.subTotal || cur.totalPrice);
        return acc + (isNaN(totalPrice) ? 0 : totalPrice);
      }, 0) || 0;

    // Revenue per day
    const daysDiff =
      Math.ceil(
        (date.end.toDate(getLocalTimeZone()).getTime() -
          date.start.toDate(getLocalTimeZone()).getTime()) /
          (1000 * 60 * 60 * 24)
      ) || 1;
    const revenuePerDay = grossRevenue / daysDiff;

    // Revenue per hour (assuming 12 hours operation per day)
    const operatingHours = daysDiff * 12;
    const revenuePerHour = grossRevenue / operatingHours;

    // Average Order Value (AOV)
    const uniqueOrderSeqs = new Set(paidOrders.map((order) => order.orderSeq));
    const totalOrders = uniqueOrderSeqs.size;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    // Food cost percentage calculation
    const foodCostPercentage =
      grossRevenue > 0 ? (totalFoodCost / grossRevenue) * 100 : 0;

    // Gross profit margin calculation
    const grossProfit =
      grossRevenue > 0
        ? ((grossRevenue - totalFoodCost) / grossRevenue) * 100
        : 0;
    const grossProfitMargin = grossProfit;

    // Labor cost percentage (placeholder - would need actual labor data)
    // Note: Labor cost tracking would require a separate labor/employee model
    const laborCostPercentage = 0;

    // Void, refund, and discount rate
    const canceledRevenue = canceledOrders.reduce((acc, cur) => {
      const totalPrice = Number(cur.subTotal || cur.totalPrice);
      return acc + (isNaN(totalPrice) ? 0 : totalPrice);
    }, 0);
    const voidRate =
      grossRevenue + canceledRevenue > 0
        ? (canceledRevenue / (grossRevenue + canceledRevenue)) * 100
        : 0;

    // Discount calculation from receipts
    const totalReceiptRevenue = receipts.reduce(
      (acc: number, r: Receipt) => acc + (Number(r.totalPrice) || 0),
      0
    );
    const totalReceiptSubtotal = receipts.reduce(
      (acc: number, r: Receipt) => acc + (Number(r.subTotal) || 0),
      0
    );
    const discountAmount = totalReceiptSubtotal - totalReceiptRevenue;
    const discountRate =
      totalReceiptSubtotal > 0
        ? (discountAmount / totalReceiptSubtotal) * 100
        : 0;

    // Popular vs unpopular menu items
    const menuItemCounts: Record<number, number> = {};
    paidOrders.forEach((order) => {
      menuItemCounts[order.menuId] =
        (menuItemCounts[order.menuId] || 0) + order.quantity;
    });

    const sortedMenuItems = Object.entries(menuItemCounts)
      .map(([menuId, count]) => ({ menuId: Number(menuId), count }))
      .sort((a, b) => b.count - a.count);

    const popularItems = sortedMenuItems.slice(0, 5);
    const unpopularItems =
      sortedMenuItems.length > 5
        ? sortedMenuItems.slice(-5).reverse()
        : sortedMenuItems.slice().reverse();

    // Table turnover rate
    const uniqueTables = new Set(paidOrders.map((order) => order.tableId));
    const tableTurnoverRate = uniqueTables.size / daysDiff;

    // Inventory variance (from warehouse data)
    const inventoryVarianceValue =
      inventoryVariance &&
      !isNaN(inventoryVariance) &&
      isFinite(inventoryVariance)
        ? inventoryVariance
        : 0;

    return {
      revenuePerDay,
      revenuePerHour,
      avgOrderValue,
      foodCostPercentage,
      grossProfitMargin,
      laborCostPercentage,
      voidRate,
      discountRate,
      popularItems,
      unpopularItems,
      tableTurnoverRate,
      inventoryVariance: inventoryVarianceValue,
      totalOrders,
      grossRevenue,
      popularMenuIds: popularItems.map((i) => i.menuId),
      unpopularMenuIds: unpopularItems.map((i) => i.menuId),
    };
  }, [orderData, receipts, date, foodCost, inventoryVariance]);

  // Fetch menu names for popular/unpopular items
  const allMenuIds = [
    ...(metrics?.popularMenuIds || []),
    ...(metrics?.unpopularMenuIds || []),
  ];
  const { data: menus } = useSWR(
    allMenuIds.length > 0 ? `menus-${allMenuIds.join(",")}` : null,
    () => fetchMenuWithIds(allMenuIds)
  );

  const countStatus = useMemo(
    () => [
      {
        name: "Revenue per Day",
        icon: <GraphUp className={iconClass} />,
        value: metrics?.revenuePerDay || 0,
        format: "currency",
      },
      {
        name: "Revenue per Hour",
        icon: <ClockCircle className={iconClass} />,
        value: metrics?.revenuePerHour || 0,
        format: "currency",
      },
      {
        name: "Avg. Order Value",
        icon: <HandMoney className={iconClass} />,
        value: metrics?.avgOrderValue || 0,
        format: "currency",
      },
      {
        name: "Food Cost %",
        icon: <Shop className={iconClass} />,
        value: metrics?.foodCostPercentage || 0,
        format: "percentage",
      },
      {
        name: "Gross Profit Margin",
        icon: <TrendingUp className={iconClass} />,
        value: metrics?.grossProfitMargin || 0,
        format: "percentage",
      },
      {
        name: "Labor Cost %",
        icon: <Users className={iconClass} />,
        value: metrics?.laborCostPercentage || 0,
        format: "percentage",
      },
      {
        name: "Void Rate",
        icon: <TrendingDown className={iconClass} />,
        value: metrics?.voidRate || 0,
        format: "percentage",
      },
      {
        name: "Discount Rate",
        icon: <Tag className={iconClass} />,
        value: metrics?.discountRate || 0,
        format: "percentage",
      },
      {
        name: "Table Turnover",
        icon: <Chart className={iconClass} />,
        value: metrics?.tableTurnoverRate || 0,
        format: "decimal",
      },
      {
        name: "Inventory Variance",
        icon: <GraphDown className={iconClass} />,
        value: metrics?.inventoryVariance || 0,
        format: "currency",
      },
    ],
    [metrics, iconClass]
  );

  const formatValue = useCallback((value: number, format: string) => {
    switch (format) {
      case "currency":
        return formatCurrency(Math.round(value));
      case "percentage":
        return `${value.toFixed(2)}%`;
      case "decimal":
        return value.toFixed(2);
      default:
        return value.toString();
    }
  }, []);

  // Prepare data for Excel export
  const exportData = useMemo(() => {
    if (!metrics) return null;

    const dateRange = date
      ? formatter.formatRange(
          date.start.toDate(getLocalTimeZone()),
          date.end.toDate(getLocalTimeZone())
        )
      : "--";

    // Financial Metrics Summary
    const metricsData = countStatus.map((item) => ({
      Metric: item.name,
      Value: formatValue(item.value, item.format),
      RawValue: item.value,
    }));

    // Add summary row
    const summaryData = [
      { Metric: "Date Range", Value: dateRange, RawValue: "" },
      {
        Metric: "Total Orders",
        Value: metrics.totalOrders,
        RawValue: metrics.totalOrders,
      },
      {
        Metric: "Gross Revenue",
        Value: formatCurrency(Math.round(metrics.grossRevenue)),
        RawValue: metrics.grossRevenue,
      },
      ...metricsData,
    ];

    // Popular Items
    const popularItemsData = metrics.popularItems.map((item, idx) => {
      const menu = menus?.find((m) => m.id === item.menuId);
      return {
        Rank: idx + 1,
        "Menu Name": menu?.name || `Menu ID: ${item.menuId}`,
        "Menu ID": item.menuId,
        "Order Count": item.count,
      };
    });

    // Unpopular Items
    const unpopularItemsData = metrics.unpopularItems.map((item, idx) => {
      const menu = menus?.find((m) => m.id === item.menuId);
      return {
        Rank: idx + 1,
        "Menu Name": menu?.name || `Menu ID: ${item.menuId}`,
        "Menu ID": item.menuId,
        "Order Count": item.count,
      };
    });

    return {
      summary: summaryData,
      popularItems: popularItemsData,
      unpopularItems: unpopularItemsData,
      dateRange,
    };
  }, [metrics, countStatus, menus, date, formatter, formatValue]);

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between gap-2 mb-2">
        <p className="text-sm text-foreground/60">
          Financial Metrics:{" "}
          {date
            ? formatter.formatRange(
                date.start.toDate(getLocalTimeZone()),
                date.end.toDate(getLocalTimeZone())
              )
            : "--"}
        </p>
        <div className="flex items-center gap-2">
          <DateRangePicker
            size="sm"
            className="bg-background rounded-xl min-w-[200px]"
            label="Date range"
            color="primary"
            value={date}
            onChange={(e) => {
              if (e) setDate({ start: e.start, end: e.end });
            }}
            variant="bordered"
          />
          {exportData && (
            <ExportToExcelBtn
              sheetsData={[
                {
                  sheetName: "Financial Metrics",
                  data: exportData.summary,
                },
                ...(exportData.popularItems.length > 0
                  ? [
                      {
                        sheetName: "Popular Items",
                        data: exportData.popularItems,
                      },
                    ]
                  : []),
                ...(exportData.unpopularItems.length > 0
                  ? [
                      {
                        sheetName: "Unpopular Items",
                        data: exportData.unpopularItems,
                      },
                    ]
                  : []),
              ]}
              fileName={`Financial Metrics - ${exportData.dateRange.replace(
                /[:\\/?*\[\]]/g,
                ""
              )}.xlsx`}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {countStatus.map((item, index) =>
          isLoading ||
          receiptsLoading ||
          foodCostLoading ||
          inventoryVarianceLoading ? (
            <DashboardCardSkeleton key={index} />
          ) : (
            <DashboardCard
              key={index}
              name={item.name}
              icon={item.icon}
              value={formatValue(item.value, item.format)}
            />
          )
        )}
      </div>
      {/* Popular vs Unpopular Items */}
      {(metrics?.popularItems.length || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4 bg-background/60 border border-default-100">
            <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="text-primary size-5" />
              Top 5 Popular Items
            </h3>
            <div className="space-y-2">
              {metrics?.popularItems.map((item, idx) => {
                const menu = menus?.find((m) => m.id === item.menuId);
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-background rounded-lg"
                  >
                    <span className="text-foreground/80">#{idx + 1}</span>
                    <span className="text-foreground font-medium flex-1 text-center">
                      {menu?.name || `Menu ID: ${item.menuId}`}
                    </span>
                    <span className="text-primary font-semibold">
                      {item.count} orders
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-4 bg-background/60 border border-default-100">
            <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="text-red-500 size-5" />
              Top 5 Unpopular Items
            </h3>
            <div className="space-y-2">
              {metrics?.unpopularItems.map((item, idx) => {
                const menu = menus?.find((m) => m.id === item.menuId);
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-background rounded-lg"
                  >
                    <span className="text-foreground/80">#{idx + 1}</span>
                    <span className="text-foreground font-medium flex-1 text-center">
                      {menu?.name || `Menu ID: ${item.menuId}`}
                    </span>
                    <span className="text-red-500 font-semibold">
                      {item.count} orders
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default FinancialMetrics;
