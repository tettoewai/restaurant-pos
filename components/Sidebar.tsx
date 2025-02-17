"use client";

import { Tooltip } from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import {
  BiCategory,
  BiFoodMenu,
  BiSolidCategory,
  BiSolidCategoryAlt,
  BiSolidFoodMenu,
} from "react-icons/bi";
import {
  IoFastFood,
  IoFastFoodOutline,
  IoSettingsOutline,
} from "react-icons/io5";

import {
  MdLocationOn,
  MdOutlineLocationOn,
  MdOutlineRestaurantMenu,
  MdOutlineSpaceDashboard,
  MdOutlineTableBar,
  MdRestaurantMenu,
  MdSpaceDashboard,
  MdTableBar,
} from "react-icons/md";
import { ImBullhorn } from "react-icons/im";
import { TbCategoryPlus } from "react-icons/tb";
import { IoSettings } from "react-icons/io5";
import Backdrop from "./BackDrop";
import ShortcutButton from "./ShortCut";

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
      icon: <IoFastFoodOutline />,
    },
    {
      name: "Dashboard",
      route: "/backoffice/dashboard",
      icon: <MdOutlineSpaceDashboard />,
    },
    {
      name: "Menu category",
      route: "/backoffice/menu-category",
      icon: <BiCategory />,
    },
    { name: "Menu", route: "/backoffice/menu", icon: <BiFoodMenu /> },
    {
      name: "Addon Category",
      route: "/backoffice/addon-category",
      icon: <TbCategoryPlus />,
    },
    {
      name: "Addon",
      route: "/backoffice/addon",
      icon: <MdOutlineRestaurantMenu />,
    },
    {
      name: "Table",
      route: "/backoffice/table",
      icon: <MdOutlineTableBar />,
    },
    {
      name: "Location",
      route: "/backoffice/location",
      icon: <MdOutlineLocationOn />,
    },
    {
      name: "Promotion",
      route: "/backoffice/promotion",
      icon: <ImBullhorn />,
    },
    {
      name: "Setting",
      route: "/backoffice/setting",
      icon: <IoSettingsOutline />,
    },
  ];

  const pathName = usePathname();
  const router = useRouter();

  return (
    <>
      {sideBarOpen && <Backdrop onClick={() => setSideBarOpen(false)} />}
      <nav
        className={clsx(
          "bg-background h-full transition-all absolute z-30 top-16 mt-2 lg:mt-0 ml-1 left-1 lg:static rounded-md shadow-sm overflow-y-scroll scrollbar-hide 2xl:w-52",
          {
            "w-52": sideBarOpen,
            "w-0 lg:w-16 2xl:w-52": !sideBarOpen,
          }
        )}
      >
        <ul>
          {sideBarItem.map((item, index) => {
            const isActive =
              pathName.split("/")[2] === item.route.split("/")[2];
            return (
              <li
                key={index}
                className="m-2 relative hover:text-primary transition-colors"
              >
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
                      className={clsx("transition-size", {
                        "mr-1 text-2xl": sideBarOpen,
                        "text-3xl": !sideBarOpen,
                      })}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </div>
                    <div
                      className={clsx(
                        "flex justify-between w-full items-center ml-1",
                        {
                          flex: sideBarOpen,
                          "hidden 2xl:flex": !sideBarOpen,
                        }
                      )}
                    >
                      <p>{item.name}</p>
                      <div>
                        <ShortcutButton
                          onPress={() => {
                            router.push(item.route);
                            setSideBarOpen(false);
                          }}
                          keys={["ctrl"]}
                          letter={
                            item.name === "Setting" ? "I" : String(index + 1)
                          }
                        />
                      </div>
                    </div>
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
