"use client";

import { Tooltip } from "@nextui-org/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { BiSolidCategoryAlt, BiSolidFoodMenu } from "react-icons/bi";
import { IoFastFood } from "react-icons/io5";

import {
  MdLocationOn,
  MdRestaurantMenu,
  MdSpaceDashboard,
  MdTableBar,
} from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
import { IoSettings } from "react-icons/io5";
import Backdrop from "./BackDrop";

interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}

interface SideBarItem {
  name: string;
  route: string;
  icon: JSX.Element;
}

export default function Sidebar({ sideBarOpen, setSideBarOpen }: Props) {
  const sideBarItem: SideBarItem[] = [
    {
      name: "Order",
      route: "/backoffice/order",
      icon: <IoFastFood />,
    },
    {
      name: "Dashboard",
      route: "/backoffice/dashboard",
      icon: <MdSpaceDashboard />,
    },
    {
      name: "Menu category",
      route: "/backoffice/menu-category",
      icon: <BiSolidCategoryAlt />,
    },
    { name: "Menu", route: "/backoffice/menu", icon: <BiSolidFoodMenu /> },
    {
      name: "Addon Category",
      route: "/backoffice/addon-category",
      icon: <TbCategoryPlus />,
    },
    {
      name: "Addon",
      route: "/backoffice/addon",
      icon: <MdRestaurantMenu />,
    },
    {
      name: "Table",
      route: "/backoffice/table",
      icon: <MdTableBar />,
    },
    {
      name: "Location",
      route: "/backoffice/location",
      icon: <MdLocationOn />,
    },
    {
      name: "Setting",
      route: "/backoffice/setting",
      icon: <IoSettings />,
    },
  ];

  const pathName = usePathname();

  return (
    <>
      {sideBarOpen && <Backdrop onClick={() => setSideBarOpen(false)} />}
      <nav
        className={clsx(
          "bg-background h-[88%] lg:h-full transition-all absolute z-30 top-16 mt-2 lg:mt-0 ml-1 left-1 lg:static rounded-md shadow-sm",
          {
            "w-52": sideBarOpen,
            "w-0 lg:w-16": !sideBarOpen,
          }
        )}
      >
        <ul>
          {sideBarItem.map((item, index) => {
            const isActive = pathName === item.route;
            return (
              <li key={index} className="m-2 relative hover:text-primary">
                <Tooltip
                  placement="right"
                  content={item.name}
                  className="text-primary"
                  showArrow={true}
                  delay={1000}
                  isDisabled={sideBarOpen}
                >
                  <Link
                    tabIndex={0}
                    aria-label={item.name}
                    href={item.route}
                    onClick={() => setSideBarOpen(false)}
                    className={clsx(
                      "flex h-12 items-center rounded-lg overflow-hidden",
                      {
                        "pl-2": sideBarOpen,
                        "justify-center border max-lg:border-none":
                          !sideBarOpen,
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
                      aria-hidden="true"
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
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
