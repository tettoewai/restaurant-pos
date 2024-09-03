import React from "react";
import TopBarOrder from "./components/TopBarOrder";
import OrderContextProvider from "@/context/OrderContext";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OrderContextProvider>
      <div className="bg-gray-200 dark:bg-gray-950 min-h-dvh select-none">
        <TopBarOrder />
        <div className="pt-16">{children}</div>
      </div>
    </OrderContextProvider>
  );
}

export default Layout;
