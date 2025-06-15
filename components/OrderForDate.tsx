"use client";
import {
  fetchMenuWithIds,
  getOrderWithDate,
  getSalesData,
} from "@/app/lib/backoffice/data";
import { DashboardCardSkeleton, TableSkeleton } from "@/app/ui/skeletons";
import { formatCurrency } from "@/function";
import { Card, DateRangePicker } from "@heroui/react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Order, OrderStatus, Receipt } from "@prisma/client";
import { useDateFormatter } from "@react-aria/i18n";
import { useState } from "react";
import { BiSolidDish } from "react-icons/bi";
import { BsCash } from "react-icons/bs";
import { IoFastFood } from "react-icons/io5";
import { TbCoinOff, TbTax } from "react-icons/tb";
import useSWR from "swr";
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
  orderData?.map((item) => {
    const isExist = sameItemOrder.find((same) => same.itemId === item.itemId);
    if (!isExist) sameItemOrder.push(item);
  });

  // const sameCodeReceipt: Order[] = [];
  // orderData?.map((item) => {
  //   const isExist = sameCodeReceipt.find((same) => same.code === item.code);
  //   if (!isExist && !item.isFoc) sameCodeReceipt.push(item);
  // });

  const grossRevenue =
    orderData
      ?.filter((item) => !item.isFoc)
      ?.filter((item) => !item.isFoc)
      .reduce((acc, cur) => {
        const totalPrice = Number(cur.subTotal);
        if (isNaN(totalPrice)) {
          console.warn("Invalid totalPrice found:", totalPrice);
        }
        return !isNaN(totalPrice) ? acc + totalPrice : acc;
      }, 0) || 0;

  const avgOrderVal =
    sameItemOrder.length > 0
      ? grossRevenue / sameItemOrder?.filter((item) => !item.isFoc).length
      : 0;

  const countedMenuOrder: { menuId: number; quantity: number } = sameItemOrder
    .filter((item) => !item.isFoc)
    .reduce((acc: any, curr) => {
      const quantity = curr.quantity;
      if (!acc[curr.menuId]) {
        acc[curr.menuId] = quantity;
      } else {
        acc[curr.menuId] += quantity;
      }

      return acc;
    }, {});
  const sortedOrder = Object.entries(countedMenuOrder)
    .slice(0, 8)
    .sort(([keyA, valueA], [keyB, valueB]) => valueB - valueA) // Sort by value in descending order
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

  const focReceipts = orderData?.filter((item) => item.isFoc);
  const focTotalPrice = focReceipts?.reduce((acc, cur) => {
    if (cur.subTotal) {
      acc += cur.subTotal;
    }
    return acc;
  }, 0);

  // const totalTax = sameCodeReceipt.reduce((acc, cur) => {
  //   if (cur.tax) {
  //     acc += cur.tax;
  //   }
  //   return acc;
  // }, 0);

  const addonIds = orderData
    ? orderData.map((item) => item.addonId).filter((item) => item !== null)
    : [];

  const countStatus = [
    {
      name: "Pending Order",
      icon: <IoFastFood className={iconClass} />,
      count: sameItemOrder.filter(
        (item) => !item.isFoc && item.status === OrderStatus.PENDING
      )?.length,
    },
    {
      name: "Total Order",
      icon: <IoFastFood className={iconClass} />,
      count: sameItemOrder.filter((item) => !item.isFoc)?.length,
    },
    {
      name: "Gross Revenue",
      icon: <BsCash className={iconClass} />,
      count: grossRevenue,
    },
    {
      name: "Avg. Order Value",
      icon: <BiSolidDish className={iconClass} />,
      count: avgOrderVal || 0,
    },
    {
      name: "Foc Menu",
      icon: <TbCoinOff className={iconClass} />,
      count:
        (focTotalPrice ? formatCurrency(focTotalPrice) : "") +
        ` (${focReceipts?.length})`,
    },
    {
      name: "Total Tax",
      icon: <TbTax className={iconClass} />,
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
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  const uniqueTotalPrice: Receipt[] = [];
  orders
    ?.sort((a, b) => a.createdAt.getMonth() - b.createdAt.getMonth())
    ?.map((item: Receipt) => {
      const isExist = uniqueTotalPrice.find(
        (same) => same.itemId === item.itemId
      );
      const sameSeq = uniqueTotalPrice.find(
        (seq) => seq.itemId === item.itemId
      );
      if (!isExist && !sameSeq) uniqueTotalPrice.push(item);
    });

  const monthlySales = Array(12).fill(0);

  uniqueTotalPrice.map((item) => {
    const monthIndex = item.createdAt.getMonth();
    monthlySales[monthIndex] += item.totalPrice;
  });
  const data = {
    labels: months,
    datasets: [
      {
        label: "Total sale",
        data: monthlySales,
        borderColor: "rgba(255, 0, 0, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
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
      <div className="flex items-center w-full justify-between">
        <p className="text-sm">
          Details in:{" "}
          {date
            ? formatter.formatRange(
                date.start.toDate(getLocalTimeZone()),
                date.end.toDate(getLocalTimeZone())
              )
            : "--"}
        </p>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            size="sm"
            className="bg-background rounded-xl"
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
        {countStatus.map((item, index) =>
          isLoading ? (
            <DashboardCardSkeleton key={index} />
          ) : (
            <Card
              className="bg-background w-full sm:w-44 h-36 flex flex-row sm:flex-col items-center m-1 mb-1"
              key={index}
            >
              <div className="flex justify-between items-center h-full sm:w-fit w-1/2 sm:h-2/5 pr-2 bg-gray-200 dark:bg-gray-900 sm:bg-transparent sm:dark:bg-transparent">
                <h3 className="m-2">{item.name}</h3>
                <Card shadow="none" className="bg-primary p-3 m-1">
                  {item.icon}
                </Card>
              </div>
              <div className="w-1/2 sm:w-full h-2/5 mt-0 sm:mt-3 flex items-center justify-center">
                <h1
                  className={`mt-2 ml-2 text-5xl text-primary text-center ${
                    item.name === "Gross Revenue" ||
                    item.name === "Avg. Order Value" ||
                    item.name === "Foc Menu" ||
                    item.name === "Total Tax"
                      ? "text-lg"
                      : ""
                  }`}
                >
                  {item.name === "Gross Revenue" ||
                  item.name === "Avg. Order Value"
                    ? formatCurrency(Math.round(Number(item.count)))
                    : item.count}
                </h1>
              </div>
            </Card>
          )
        )}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 mt-2 space-x-0 md:space-x-1 space-y-0 md:space-y-1">
          <div className="w-full">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <h2>Top 8 Most Ordered Menus</h2>
                <ListTable columns={columns} rows={rows} />
              </>
            )}
          </div>
          <div className="w-full">
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
