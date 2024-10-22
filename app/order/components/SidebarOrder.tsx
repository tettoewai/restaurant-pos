import clsx from "clsx";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { IoMdHome } from "react-icons/io";
import { TbArrowsExchange2 } from "react-icons/tb";
import { AiFillInfoCircle } from "react-icons/ai";
import { MdGroups2 } from "react-icons/md";
import { RiCustomerService2Fill } from "react-icons/ri";
import Backdrop from "@/components/BackDrop";

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
      route: "",
      icon: <TbArrowsExchange2 />,
    },
    {
      name: "About us",
      route: "",
      icon: <MdGroups2 />,
    },
    {
      name: "Contace us",
      route: "",
      icon: <RiCustomerService2Fill />,
    },
  ];
  return (
    <>
      {sideBarOpen && <Backdrop onClick={() => setSideBarOpen(false)} />}
      <nav
        className={clsx(
          "h-[89%] w-0 rounded-md bg-background fixed z-30 top-16 mt-1 overflow-hidden transition-width",
          { "w-44": sideBarOpen }
        )}
      >
        <ul>
          {sideBarItem.map((item, index) => {
            const isActive = `${pathName}?tableId=${tableId}` === item.route;
            return (
              <li key={index} className="m-2 relative hover:text-primary">
                <Link
                  href={item.route}
                  onClick={() => setSideBarOpen(false)}
                  className={clsx(
                    "flex h-12 items-center rounded-lg overflow-hidden",
                    {
                      "pl-2": sideBarOpen,
                      "justify-center border max-lg:border-none": !sideBarOpen,
                      "border-red-700 border text-primary bg-gray-100 dark:bg-gray-800":
                        isActive,
                      border: !isActive,
                    }
                  )}
                >
                  <div
                    className={clsx({
                      "mr-1 text-2xl": sideBarOpen,
                      "text-3xl": !sideBarOpen,
                    })}
                  >
                    {item.icon}
                  </div>
                  <p
                    className={clsx("transition-all", {
                      flex: sideBarOpen,
                      hidden: !sideBarOpen,
                    })}
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
