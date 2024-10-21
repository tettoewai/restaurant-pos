"use client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ScrollShadow } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { ReactNode, useState } from "react";
import { ToastContainer } from "react-toastify";
import useSWR from "swr";
import { createDefaultData, fetchUser } from "../lib/backoffice/data";
import BackOfficeContextProvider from "@/context/BackOfficeContext";
import Backdrop from "@/components/BackDrop";

interface Props {
  children: ReactNode;
}
const Layout = ({ children }: Props) => {
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { data } = useSession();
  const userEmail = data?.user?.email;
  const userName = data?.user?.name;

  const { data: user } = useSWR("user", () => fetchUser().then((res) => res));
  if (user?.email !== userEmail && userEmail && userName) {
    createDefaultData({ email: userEmail, name: userName });
  }
  return (
    <BackOfficeContextProvider>
      <div className="bg-gray-200 dark:bg-gray-950 h-dvh select-none">
        <div className="p-1  w-full">
          <TopBar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
        </div>

        <div className="flex h-[88%]">
          <Sidebar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
          <ScrollShadow
            hideScrollBar
            size={20}
            className="px-2 pb-3 w-full max-h-full vertical"
          >
            {children}
          </ScrollShadow>
        </div>
        <ToastContainer theme={resolvedTheme} position="bottom-right" />
      </div>
    </BackOfficeContextProvider>
  );
};
export default Layout;
