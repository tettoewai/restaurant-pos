import { baseMetadata } from "@/app/lib/baseMetadata";
import FinancialMetrics from "@/components/FinancialMetrics";
import OrderForDate from "@/components/OrderForDate";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Dashboard | ${baseMetadata.title}`,
};

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-col mb-2">
        <span className="text-2xl font-semibold text-foreground">
          Dashboard
        </span>
        <span className="text-sm text-foreground/60">
          Monitor sales, orders, and performance
        </span>
      </div>
      <OrderForDate />
      <FinancialMetrics />
    </div>
  );
};

export default Dashboard;
