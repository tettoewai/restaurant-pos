"use client";
import { getSalesData } from "@/app/lib/backoffice/data";
import { ChartSkeleton } from "@/app/ui/skeletons";
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Skeleton,
} from "@nextui-org/react";
import { Order } from "@prisma/client";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { title } from "process";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import { IoIosArrowDown } from "react-icons/io";
import useSWR from "swr";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(new Set([currentYear]));
  const { data: orders, isLoading } = useSWR(
    [Array.from(selectedYear)[0]],
    () => getSalesData(Array.from(selectedYear)[0]).then((res) => res)
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

  const uniqueTotalPrice: Order[] = [];
  orders
    ?.sort((a, b) => a.createdAt.getMonth() - b.createdAt.getMonth())
    ?.map((item: Order) => {
      const isExist = uniqueTotalPrice.find(
        (same) => same.itemId === item.itemId
      );
      const sameSeq = uniqueTotalPrice.find(
        (seq) => seq.orderSeq === item.orderSeq
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
        data: monthlySales, // Pass the sales data here
        borderColor: "rgba(255, 0, 0, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const handleYearChange = (e: any) => {
    setSelectedYear(e);
  };
  const generateYears = (start: number, end: number) => {
    const years = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  };

  const years = generateYears(currentYear - 9, currentYear).sort(
    (a, b) => b - a
  );

  return (
    <Card className="h-fit w-full md:w-3/5 bg-background p-2 mt-1">
      <div className="w-full flex justify-end">
        <Dropdown className="bg-background">
          <DropdownTrigger>
            <Button
              variant="light"
              className="w-fit p-0"
              endContent={<IoIosArrowDown className="text-primary" />}
            >
              {selectedYear}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Year selector"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedYear}
            onSelectionChange={handleYearChange}
          >
            {years.map((item) => (
              <DropdownItem textValue={String(item)} key={item}>
                {item}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      {isLoading ? <ChartSkeleton /> : <Line data={data} options={options} />}
    </Card>
  );
};

export default SalesChart;
