"use client";
import {
  fetchMenuWithIds,
  getOrderCountWithDate,
} from "@/app/lib/backoffice/data";
import { DashboardCardSkeleton, TableSkeleton } from "@/app/ui/skeletons";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Card, DateRangePicker } from "@nextui-org/react";
import { Order } from "@prisma/client";
import { useDateFormatter } from "@react-aria/i18n";
import clsx from "clsx";
import { useState } from "react";
import { BiSolidDish } from "react-icons/bi";
import { BsCash } from "react-icons/bs";
import { IoFastFood } from "react-icons/io5";
import { MdOutlinePendingActions } from "react-icons/md";
import useSWR from "swr";
import ListTable from "./ListTable";

function OrderForDate() {
  const iconClass = "text-white size-6";

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState({
    start: parseDate(today),
    end: parseDate(today),
  });
  let formatter = useDateFormatter({ dateStyle: "long" });
  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;
  const { data: totalOrder, isLoading } = useSWR(
    [date, isUpdateLocation],
    () =>
      getOrderCountWithDate(
        date.start.toDate(getLocalTimeZone()),
        date.end.toDate(getLocalTimeZone())
      ).then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const sameMenuOrder: Order[] = [];
  totalOrder?.map((item) => {
    const isExist = sameMenuOrder.find((same) => same.itemId === item.itemId);
    if (!isExist) sameMenuOrder.push(item);
  });

  const grossRevenue = sameMenuOrder.reduce(
    (acc, cur) => acc + cur.totalPrice,
    0
  );
  const avgOrderVal = grossRevenue / sameMenuOrder.length;
  const pendingOrder = sameMenuOrder?.filter(
    (item) => item.status === "PENDING"
  );
  const countStatus = [
    {
      name: "Pending Order",
      icon: <MdOutlinePendingActions className={iconClass} />,
      count: pendingOrder?.length,
    },
    {
      name: "Total Order",
      icon: <IoFastFood className={iconClass} />,
      count: sameMenuOrder?.length,
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
  ];

  const sortedOrders = sameMenuOrder
    .map((order) => ({
      ...order,
      menuCount: sameMenuOrder.filter((o) => o.menuId === order.menuId).length,
    }))
    .sort((a, b) => b.menuCount - a.menuCount);

  const topOrdeResult = sortedOrders.map(({ menuCount, ...order }) => order);

  const topMenuOrdered = topOrdeResult.map((item) => item.menuId);
  const { data: menus } = useSWR([topMenuOrdered], () =>
    fetchMenuWithIds(topMenuOrdered).then((res) => res)
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
  const rows: { key: number; name: string; count: number }[] = [];

  menus?.map((item, index) => {
    const validCount = sortedOrders.find(
      (o) => o.menuId === item.id
    )?.menuCount;
    validCount &&
      rows.push({ key: index + 1, name: item.name, count: validCount });
  });
  const topFiveRows = rows.slice(0, 5);
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
        <div className="pr-3">
          <DateRangePicker
            className="max-w-[284px] bg-background rounded-xl"
            label="Date range"
            color="primary"
            value={date}
            onChange={setDate}
            variant="bordered"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap space-x-2">
        {countStatus.map((item, index) =>
          isLoading ? (
            <DashboardCardSkeleton key={index} />
          ) : (
            <Card
              className="bg-background w-full sm:w-44 h-36 flex flex-row sm:flex-col items-center mb-2"
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
                  className={clsx(
                    "mt-2 ml-2 text-5xl text-primary text-center",
                    {
                      "text-lg":
                        item.name === "Gross Revenue" ||
                        item.name === "Avg. Order Value",
                    }
                  )}
                >
                  {item.name === "Gross Revenue" ||
                  item.name === "Avg. Order Value"
                    ? `${Math.round(item.count)} Ks`
                    : Math.round(item.count)}
                </h1>
              </div>
            </Card>
          )
        )}
        <div className="w-full sm:w-96">
          <h4 className="mb-1">​Top 5 menus with the most sales</h4>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <ListTable columns={columns} rows={topFiveRows} />
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderForDate;
