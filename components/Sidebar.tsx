"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { BiSolidCategoryAlt, BiSolidFoodMenu } from "react-icons/bi";
import { MdRestaurantMenu, MdSpaceDashboard } from "react-icons/md";

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
      name: "Dashboard",
      route: "/backoffice/dashboard",
      icon: <MdSpaceDashboard />,
    },
    { name: "Menu", route: "/backoffice/menu", icon: <BiSolidFoodMenu /> },
    {
      name: "Menu category",
      route: "/backoffice/menu-category",
      icon: <BiSolidCategoryAlt />,
    },
    {
      name: "Addon",
      route: "/backoffice/addon",
      icon: <MdRestaurantMenu />,
    },
  ];

  const pathName = usePathname();

  return (
    <div
      className={clsx(
        "bg-background h-[88%] lg:h-full transition-all absolute z-20 top-20 left-1 lg:static rounded-md shadow-sm",
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
            <li key={index} className="m-2 relative hover:text-red-500">
              <Link
                href={item.route}
                onClick={() => setSideBarOpen(false)}
                className={clsx(
                  "flex h-12 items-center rounded-lg overflow-hidden",
                  {
                    "pl-2": sideBarOpen,
                    "justify-center border max-lg:border-none": !sideBarOpen,
                    "border-red-700 border text-red-500 bg-gray-100 dark:bg-gray-800":
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
    </div>
  );
}
