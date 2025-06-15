"use client";
import TopBar from "@/components/TopBar";
import { ScrollShadow } from "@heroui/react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { ReactNode, useState } from "react";
import useSWR from "swr";
import { createDefaultData, fetchUser } from "../lib/backoffice/data";
import Sidebar from "@/components/Sidebar";

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
    <div className="bg-gray-200 dark:bg-gray-950 h-dvh">
      <div className="p-1  w-full">
        <TopBar sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
      </div>

      <div className="w-full h-[88%] 2xl:h-[90%] flex justify-center">
        <div className="flex h-full w-full lg:max-w-screen-2xl">
          <Sidebar
            sideBarOpen={sideBarOpen}
            setSideBarOpen={setSideBarOpen}
            isFromWarehouse
          />
          <ScrollShadow
            hideScrollBar
            size={20}
            className="px-2 pb-3 w-full max-h-full vertical"
          >
            {children}
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
};
export default Layout;
