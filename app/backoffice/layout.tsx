"use client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ScrollShadow } from "@nextui-org/react";
import { useTheme } from "next-themes";
import { ReactNode, useState } from "react";
import { ToastContainer } from "react-toastify";

interface Props {
  children: ReactNode;
}
const Layout = ({ children }: Props) => {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <div className="bg-gray-200 dark:bg-gray-950 h-dvh select-none">
      <div className="p-1  w-full">
        <TopBar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
      </div>

      <div className="flex pl-1 h-[88%]">
        <Sidebar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
        <ScrollShadow hideScrollBar className="pl-2 w-full max-h-full vertical">
          {children}
        </ScrollShadow>
      </div>
      <ToastContainer theme={resolvedTheme} position="bottom-right" />
    </div>
  );
};
export default Layout;
