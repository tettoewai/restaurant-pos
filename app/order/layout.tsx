"use client";

import OrderContextProvider from "@/context/OrderContext";
import TopBarOrder from "./components/TopBarOrder";
import CheckLocation from "./components/CheckLocation";
import { Suspense } from "react";
import DownloadReceiptOrder from "./components/DownloadReceiptOrder";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OrderContextProvider>
      <div>
        <div className="bg-gray-200 dark:bg-gray-950 min-h-dvh">
          <Suspense>
            <TopBarOrder />
          </Suspense>
          <div className="pt-16 px-1">
            <Suspense>
              <CheckLocation>{children}</CheckLocation>
            </Suspense>
          </div>
        </div>
      </div>
      <Suspense>
        <DownloadReceiptOrder />
      </Suspense>
    </OrderContextProvider>
  );
}

export default Layout;
