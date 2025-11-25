"use client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BackOfficeContextProvider from "@/context/BackOfficeContext";
import { ScrollShadow } from "@heroui/react";
import { ReactNode, useState } from "react";
interface Props {
  children: ReactNode;
}
const Layout = ({ children }: Props) => {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  return (
    <BackOfficeContextProvider>
      <div className="bg-gray-200 dark:bg-gray-950 h-dvh">
        <div className="p-1  w-full">
          <TopBar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
        </div>

        <div className="w-full h-[88%] 2xl:h-[90%] flex justify-center">
          <div className="flex h-full w-full lg:max-w-(--breakpoint-2xl)">
            <Sidebar
              sideBarOpen={sideBarOpen}
              setSideBarOpen={setSideBarOpen}
            />
            <main className="w-full">
              <ScrollShadow
                hideScrollBar
                size={20}
                className="px-2 pb-3 w-full max-h-full"
                orientation="vertical"
              >
                {children}
              </ScrollShadow>
            </main>
          </div>
        </div>
      </div>
    </BackOfficeContextProvider>
  );
};
export default Layout;
