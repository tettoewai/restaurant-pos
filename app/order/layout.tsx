import React from "react";
import TopBarOrder from "./components/TopBarOrder";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-200 dark:bg-gray-950 min-h-screen select-none p-1">
      <TopBarOrder />
      <div className="pt-16">{children}</div>
    </div>
  );
}

export default Layout;
