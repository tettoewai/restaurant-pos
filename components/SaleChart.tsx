"use client";
import { ChartSkeleton } from "@/app/ui/skeletons";
import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { AltArrowDown } from "@solar-icons/react/ssr";
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
import { Dispatch, SetStateAction } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({
  selectedYear,
  setSelectedYear,
  data,
  isLoading,
}: {
  selectedYear: Set<number>;
  setSelectedYear: Dispatch<SetStateAction<Set<number>>>;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: any[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }[];
  };
  isLoading: boolean;
}) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const currentYear = new Date().getFullYear();

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
    <Card className="h-fit w-full bg-background">
      <div className="w-full flex justify-end">
        <Dropdown className="bg-background">
          <DropdownTrigger>
            <Button
              variant="light"
              className="w-fit p-0"
              endContent={<AltArrowDown className="text-primary" />}
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
