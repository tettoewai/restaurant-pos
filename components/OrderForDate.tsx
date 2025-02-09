"use client";
import {
  fetchAddonWithIds,
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
import { TbCoinOff } from "react-icons/tb";
import SalesChart from "./SaleChart";
import { getTotalOrderPrice } from "@/general";
import { formatCurrency } from "@/function";

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
  const sameItemOrder: Order[] = [];
  totalOrder?.map((item) => {
    const isExist = sameItemOrder.find((same) => same.itemId === item.itemId);
    if (!isExist) sameItemOrder.push(item);
  });

  const grossRevenue = sameItemOrder
    .filter((item) => !item.isFoc)
    .reduce((acc, cur) => {
      const totalPrice = Number(cur.totalPrice);
      if (isNaN(totalPrice)) {
        console.warn("Invalid totalPrice found:", cur.totalPrice);
      }
      return !isNaN(totalPrice) ? acc + cur.totalPrice : acc;
    }, 0);
  const avgOrderVal =
    sameItemOrder.length > 0 ? grossRevenue / sameItemOrder.length : 0;
  const pendingOrder = sameItemOrder?.filter(
    (item) => item.status === "PENDING"
  );

  const countedMenuOrder: { menuId: number; quantity: number } =
    sameItemOrder.reduce((acc: any, curr) => {
      const quantity = curr.quantity;
      if (!acc[curr.menuId]) {
        acc[curr.menuId] = quantity;
      } else {
        acc[curr.menuId] += quantity;
      }

      return acc;
    }, {});

  const sortedOrder = Object.entries(countedMenuOrder)
    .slice(0, 5)
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
  const rows: { key: number; name: string; count: number }[] = sortedOrder.map(
    (item, index) => {
      const menu = menus?.find((o) => o.id === item.menuId);
      return { key: index + 1, name: menu?.name || "", count: item.quantity };
    }
  );

  const focOrder = totalOrder?.filter((item) => item.isFoc);

  const addonIds = totalOrder
    ? totalOrder.map((item) => item.addonId).filter((item) => item !== null)
    : [];
  const { data: addonData } = useSWR(
    addonIds?.length ? `addonData-${addonIds}` : null,
    () => fetchAddonWithIds(addonIds)
  );
  const focTotalPrice = getTotalOrderPrice({
    orders: focOrder,
    menus,
    addons: addonData,
  });
  const countStatus = [
    {
      name: "Pending Order",
      icon: <MdOutlinePendingActions className={iconClass} />,
      count: pendingOrder?.length,
    },
    {
      name: "Total Order",
      icon: <IoFastFood className={iconClass} />,
      count: sameItemOrder?.length,
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
        ` (${focOrder?.length})`,
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
                  className={clsx(
                    "mt-2 ml-2 text-5xl text-primary text-center",
                    {
                      "text-lg":
                        item.name === "Gross Revenue" ||
                        item.name === "Avg. Order Value" ||
                        item.name === "Foc Menu",
                    }
                  )}
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
                <h2>Top 5 Most Ordered Menus</h2>
                <ListTable columns={columns} rows={rows} />
              </>
            )}
          </div>
          <div className="w-full">
            <SalesChart />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderForDate;
