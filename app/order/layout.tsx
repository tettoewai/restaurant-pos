import OrderContextProvider from "@/context/OrderContext";
import { ScrollShadow } from "@heroui/react";
import { Suspense } from "react";
import CheckLocation from "./components/CheckLocation";
import DownloadReceiptOrder from "./components/DownloadReceiptOrder";
import TopBarOrder from "./components/TopBarOrder";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OrderContextProvider>
      <div className="bg-gray-200 dark:bg-gray-950 h-dvh">
        <Suspense
          fallback={
            <div className="w-full h-16 flex items-center justify-center">
              <span>Loading table info...</span>
            </div>
          }
        >
          <TopBarOrder />
        </Suspense>
        <main className="pt-16 px-1 w-full">
          <ScrollShadow
            hideScrollBar
            size={20}
            className="w-full max-h-dvh pb-20"
            orientation="vertical"
          >
            <Suspense
              fallback={
                <div className="w-full h-40 flex items-center justify-center">
                  <span>Validating your location...</span>
                </div>
              }
            >
              <CheckLocation>{children}</CheckLocation>
            </Suspense>
          </ScrollShadow>
        </main>
      </div>
      <Suspense fallback={null}>
        <DownloadReceiptOrder />
      </Suspense>
    </OrderContextProvider>
  );
}

export default Layout;
