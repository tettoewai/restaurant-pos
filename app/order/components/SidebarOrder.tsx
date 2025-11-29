import Backdrop from "@/components/BackDrop";
import {
  CallChatRounded,
  CartCheck,
  Home,
  RoundTransferHorizontal,
  UsersGroupTwoRounded,
} from "@solar-icons/react/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  tableId: string;
}
export default function SidebarOrder({
  sideBarOpen,
  setSideBarOpen,
  tableId,
}: Props) {
  const pathName = usePathname();
  const sideBarItem = [
    {
      name: "Home",
      route: `/order?tableId=${tableId}`,
      icon: Home,
    },
    {
      name: "Active orders",
      route: `/order/active-order?tableId=${tableId}`,
      icon: CartCheck,
    },
    {
      name: "Change table",
      route: `/order/change-table?tableId=${tableId}`,
      icon: RoundTransferHorizontal,
    },
    {
      name: "About us",
      route: `/order/about-us?tableId=${tableId}`,
      icon: UsersGroupTwoRounded,
    },
    {
      name: "Contact us",
      route: `/order/contact-us?tableId=${tableId}`,
      icon: CallChatRounded,
    },
  ];
  return (
    <>
      {sideBarOpen && <Backdrop onClick={() => setSideBarOpen(false)} />}
      <nav
        className={`h-[92%] w-0 rounded-md bg-background fixed z-30 top-16 mt-1 ml-0.5 overflow-hidden transition-width ${
          sideBarOpen ? "w-44" : ""
        }`}
      >
        <ul>
          {sideBarItem.map((item, index) => {
            const isActive = `${pathName}?tableId=${tableId}` === item.route;
            const Icon = item.icon;
            return (
              <li key={index} className="m-2 relative hover:text-primary">
                <Link
                  href={item.route}
                  onClick={() => setSideBarOpen(false)}
                  className={`flex h-12 items-center rounded-lg overflow-hidden ${
                    sideBarOpen
                      ? "pl-2"
                      : "justify-center border max-lg:border-none"
                  } ${
                    isActive
                      ? "border-red-700 border text-primary bg-gray-100 dark:bg-gray-800"
                      : "border"
                  }`}
                >
                  <Icon
                    className={sideBarOpen ? "mr-1 text-2xl" : "text-3xl"}
                  />
                  <p
                    className={`transition-all ${
                      sideBarOpen ? "flex" : "hidden"
                    }`}
                  >
                    {item.name}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
