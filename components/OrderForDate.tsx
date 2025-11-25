"use client";
import {
  fetchMenuWithIds,
  getOrderWithDate,
  getSalesData,
} from "@/app/lib/backoffice/data";
import { DashboardCardSkeleton, TableSkeleton } from "@/app/ui/skeletons";
import { formatCurrency } from "@/function";
import { Alert, DateRangePicker } from "@heroui/react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Order, OrderStatus, Receipt } from "@prisma/client";
import { useDateFormatter } from "@react-aria/i18n";
import {
  ChecklistMinimalistic,
  ClockCircle,
  GraphUp,
  HandMoney,
} from "@solar-icons/react/ssr";
import { BanknoteX, HandPlatter } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import DashboardCard from "./DashboardCard";
import ExportToExcelBtn from "./ExportToExcelBtn";
import ListTable from "./ListTable";
import SalesChart from "./SaleChart";

function OrderForDate() {
  const iconClass = "text-white size-6";
  const nowDate = new Date();
  const today = nowDate.toISOString().split("T")[0];
  const [date, setDate] = useState({
    start: parseDate(today),
    end: parseDate(today),
  });
  let formatter = useDateFormatter({ dateStyle: "long" });
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  const { data: orderData, isLoading } = useSWR(
    [date, isUpdateLocation],
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
  const sameItemOrder: Order[] = [];
  orderData && orderData.length > 0
    ? orderData?.map((item) => {
        const isExist = sameItemOrder.find(
          (same) => same.itemId === item.itemId
        );
        if (!isExist) sameItemOrder.push(item);
      })
    : [];

  const grossRevenue =
    orderData && orderData.length > 0
      ? orderData
          .filter((item) => !item.isFoc)
          .reduce((acc, cur) => {
            const totalPrice = Number(cur.subTotal);
            if (isNaN(totalPrice)) {
              console.warn("Invalid totalPrice found:", totalPrice);
            }
            return !isNaN(totalPrice) ? acc + totalPrice : acc;
          }, 0)
      : 0;

  const avgOrderVal =
    sameItemOrder.length > 0
      ? grossRevenue / sameItemOrder?.filter((item) => !item.isFoc).length
      : 0;

  const countedMenuOrder: Record<number, number> = sameItemOrder
    .filter((item) => !item.isFoc)
    .reduce((acc: Record<number, number>, curr) => {
      const quantity = curr.quantity;
      if (!acc[curr.menuId]) {
        acc[curr.menuId] = quantity;
      } else {
        acc[curr.menuId] += quantity;
      }

      return acc;
    }, {});
  const sortedOrder = Object.entries(countedMenuOrder)
    .sort(([, valueA], [, valueB]) => valueB - valueA) // Sort by value in descending order
    .slice(0, 8)
    .reduce((acc: { menuId: number; quantity: number }[], [key, value]) => {
      acc.push({ menuId: Number(key), quantity: value });
      return acc;
    }, []);

  const topOrdeResult = sortedOrder.map((item) => item.menuId);

  const { data: menus } = useSWR(`menus - ${[topOrdeResult.join(", ")]}`, () =>
    fetchMenuWithIds(topOrdeResult).then((res) => res)
  );
  const columns = [
    {
      key: "key",
      label: "No.",
    },
    {
      key: "name",
      label: "Name",
    },
    { key: "count", label: "Count" },
  ];

  // top 8 table data
  const rows: { key: number; name: string; count: number }[] = sortedOrder.map(
    (item, index) => {
      const menu = menus?.find((o) => o.id === item.menuId);
      return { key: index + 1, name: menu?.name || "", count: item.quantity };
    }
  );

  const focReceipts =
    orderData && orderData.length > 0
      ? orderData.filter((item) => item.isFoc)
      : [];
  const focTotalPrice =
    focReceipts.length > 0
      ? focReceipts.reduce((acc, cur) => {
          if (cur.subTotal) {
            acc += cur.subTotal;
          }
          return acc;
        }, 0)
      : 0;

  const countStatus = [
    {
      name: "Pending Order",
      icon: <ClockCircle className={iconClass} />,
      count: sameItemOrder.filter(
        (item) => !item.isFoc && item.status === OrderStatus.PENDING
      )?.length,
    },
    {
      name: "Total Order",
      icon: <ChecklistMinimalistic className={iconClass} />,
      count: sameItemOrder.filter((item) => !item.isFoc)?.length,
    },
    {
      name: "Gross Revenue",
      icon: <GraphUp className={iconClass} />,
      count: grossRevenue,
    },
    {
      name: "Avg. Order Value",
      icon: <HandPlatter className={iconClass} />,
      count: avgOrderVal || 0,
    },
    {
      name: "Foc Menu",
      icon: <BanknoteX className={iconClass} />,
      count:
        (focTotalPrice ? formatCurrency(focTotalPrice) : "") +
        ` (${focReceipts?.length})`,
    },
    {
      name: "Total Tax",
      icon: <HandMoney className={iconClass} />,
      count: formatCurrency(0),
    },
  ];

  // SaleChart

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(new Set([currentYear]));
  const { data: orders, isLoading: yearDataLoading } = useSWR(
    [Array.from(selectedYear)[0], isUpdateLocation],
    () => getSalesData(Array.from(selectedYear)[0])
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlySales = Array(12).fill(0);

  orders?.forEach((item: Receipt) => {
    const monthIndex = new Date(item.createdAt).getMonth();
    monthlySales[monthIndex] += Number(item.totalPrice) || 0;
  });
  const data = {
    labels: months,
    datasets: [
      {
        label: "Total Sales",
        data: monthlySales,
        borderColor: "rgba(239, 68, 68, 1)", // red-500
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        tension: 0.4,
      },
      // Orders count per month
      {
        label: "Orders Count",
        data: (() => {
          const monthlyOrders = Array(12).fill(0);
          orders?.forEach((item: Receipt) => {
            const monthIndex = new Date(item.createdAt).getMonth();
            monthlyOrders[monthIndex] += 1;
          });
          return monthlyOrders;
        })(),
        borderColor: "rgba(59, 130, 246, 1)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        tension: 0.4,
        yAxisID: "y2", // allow dual-axis if configured inside SalesChart
      },
      // Average ticket per month
      {
        label: "Avg Ticket",
        data: (() => {
          const monthlyOrders = Array(12).fill(0);
          orders?.forEach((item: Receipt) => {
            const monthIndex = new Date(item.createdAt).getMonth();
            monthlyOrders[monthIndex] += 1;
          });
          return monthlySales.map((total: number, idx: number) =>
            monthlyOrders[idx] > 0 ? Math.round(total / monthlyOrders[idx]) : 0
          );
        })(),
        borderColor: "rgba(34, 197, 94, 1)", // green-500
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        tension: 0.4,
      },
    ],
  };

  const yearSaleData = monthlySales.map((item, index) => {
    return { month: months[index], totalSales: item };
  });

  const saleData = [
    {
      totalOrder: sameItemOrder.filter((item) => !item.isFoc)?.length,
      grossRevenue,
      avgOrderVal,
      focMenu:
        (focTotalPrice ? formatCurrency(focTotalPrice) : "") +
        ` (${focReceipts?.length})`,
      totalTax: formatCurrency(0),
    },
  ];
  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between gap-2 mb-2">
        <p className="text-sm text-foreground/60">
          Details in:{" "}
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
          <ExportToExcelBtn
            sheetsData={[
              { sheetName: "Sale Data", data: saleData },
              { sheetName: "Top 8 Most Ordered Data", data: rows },
              {
                sheetName: `${Array.from(selectedYear)[0]} Total Sales`,
                data: yearSaleData,
              },
            ]}
            fileName={`${formatter
              .formatRange(
                date.start.toDate(getLocalTimeZone()),
                date.end.toDate(getLocalTimeZone())
              )
              .replace(/[:\\/?*\[\]]/g, "")
              .substring(0, 31)} - Sale data.xlsx`}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {countStatus.map((item, index) =>
            isLoading ? (
              <DashboardCardSkeleton key={index} />
            ) : (
              <DashboardCard
                key={index}
                name={item.name}
                icon={item.icon}
                value={
                  item.name === "Gross Revenue" ||
                  item.name === "Avg. Order Value"
                    ? formatCurrency(Math.round(Number(item.count)))
                    : item.count
                }
                valueClassName={
                  item.name === "Gross Revenue" ||
                  item.name === "Avg. Order Value" ||
                  item.name === "Foc Menu" ||
                  item.name === "Total Tax"
                    ? "text-xs sm:text-sm text-foreground"
                    : ""
                }
              />
            )
          )}
        </div>
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 mt-4 gap-4">
          <div className="w-full min-w-0">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <h2 className="text-foreground/80 font-medium mb-2 text-sm sm:text-base">
                  Top 8 Most Ordered Menus
                </h2>
                <div className="overflow-x-auto">
                  <ListTable columns={columns} rows={rows} />
                </div>
              </>
            )}
          </div>
          <div className="w-full min-w-0">
            <SalesChart
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              data={data}
              isLoading={yearDataLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderForDate;
