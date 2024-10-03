import OrderForDate from "@/components/OrderForDate";
import SalesChart from "@/components/SaleChart";

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-col">
        <span className="text-primary">Dashboard</span>
        <span className="text-sm text-gray-600">Track your steps</span>
      </div>
      <OrderForDate />
      <SalesChart />
    </div>
  );
};

export default Dashboard;
