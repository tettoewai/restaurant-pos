import { baseMetadata } from "@/app/lib/baseMetadata";
import OrderForDate from "@/components/OrderForDate";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Dashboard | ${baseMetadata.title}`,
};

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-col">
        <span className="text-primary">Dashboard</span>
        <span className="text-sm text-gray-600">Track your steps</span>
      </div>
      <OrderForDate />
    </div>
  );
};

export default Dashboard;
