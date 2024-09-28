import OrderForDate from "@/components/OrderForDate";

const Dashboard = () => {
  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Dashboard</span>
        <span className="text-sm text-gray-600">Track your steps</span>
      </div>
      <OrderForDate />
    </div>
  );
};

export default Dashboard;
