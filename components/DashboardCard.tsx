"use client";
import { Card } from "@heroui/react";
import { ReactNode } from "react";

interface DashboardCardProps {
  name: string;
  icon: ReactNode;
  value: string | number;
  className?: string;
  valueClassName?: string;
}

function DashboardCard({
  name,
  icon,
  value,
  className = "",
  valueClassName = "",
}: DashboardCardProps) {
  return (
    <Card
      className={`bg-background/60 flex flex-col items-center p-3 rounded-xl border border-default-100 hover:border-primary hover:shadow-md transition-all min-h-[120px] ${className}`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="font-medium text-foreground text-xs sm:text-sm flex-1">
          {name}
        </h3>
        <Card
          shadow="none"
          className="text-white p-2 rounded-lg bg-primary size-10 sm:size-12 flex items-center justify-center flex-shrink-0"
        >
          {icon}
        </Card>
      </div>
      <div className="w-full flex items-center justify-center flex-1">
        <h1
          className={`text-lg sm:text-xl md:text-2xl text-primary text-center font-semibold break-words ${valueClassName}`}
        >
          {value}
        </h1>
      </div>
    </Card>
  );
}

export default DashboardCard;
