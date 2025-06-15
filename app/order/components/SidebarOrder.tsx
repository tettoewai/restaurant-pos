import Backdrop from "@/components/BackDrop";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { AiFillInfoCircle } from "react-icons/ai";
import { IoMdHome } from "react-icons/io";
import { MdGroups2 } from "react-icons/md";
import { RiCustomerService2Fill } from "react-icons/ri";
import { TbArrowsExchange2 } from "react-icons/tb";

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
      icon: <IoMdHome />,
    },
    {
      name: "Active orders",
      route: `/order/active-order?tableId=${tableId}`,
      icon: <AiFillInfoCircle />,
    },
    {
      name: "Change table",
      route: `/order/change-table?tableId=${tableId}`,
      icon: <TbArrowsExchange2 />,
    },
    {
      name: "About us",
      route: "",
      icon: <MdGroups2 />,
    },
    {
      name: "Contact us",
      route: "",
      icon: <RiCustomerService2Fill />,
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
                  <div className={sideBarOpen ? "mr-1 text-2xl" : "text-3xl"}>
                    {item.icon}
                  </div>
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
