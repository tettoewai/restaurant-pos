"use client";

import { Tooltip } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { BiBox, BiCategory, BiChart, BiFoodMenu } from "react-icons/bi";
import { GiMeal } from "react-icons/gi";
import { IoFastFoodOutline, IoSettingsOutline } from "react-icons/io5";
import { LuGitCompareArrows } from "react-icons/lu";

import { AiOutlineAudit } from "react-icons/ai";
import { ImBullhorn } from "react-icons/im";
import { IoIosPeople } from "react-icons/io";
import {
  MdFoodBank,
  MdOutlineFastfood,
  MdOutlineInventory,
  MdOutlineLocationOn,
  MdOutlineRestaurantMenu,
  MdOutlineTableBar,
} from "react-icons/md";
import { TbCategoryPlus, TbShoppingCartDollar } from "react-icons/tb";
import Backdrop from "./BackDrop";
import ShortcutButton from "./ShortCut";

interface Props {
  sideBarOpen: boolean;
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  isFromWarehouse?: boolean;
}

interface SideBarItem {
  name: string;
  route: string;
  icon: JSX.Element;
}

export default function Sidebar({
  sideBarOpen,
  setSideBarOpen,
  isFromWarehouse,
}: Props) {
  const backOfficeSidebar = [
    {
      name: "Order",
      route: "/backoffice/order",
      icon: <IoFastFoodOutline />,
    },
    {
      name: "Dashboard",
      route: "/backoffice/dashboard",
      icon: <BiChart />,
    },
    {
      name: "Menu category",
      route: "/backoffice/menu-category",
      icon: <BiCategory />,
    },
    { name: "Menu", route: "/backoffice/menu", icon: <BiFoodMenu /> },
    {
      name: "Add-on Category",
      route: "/backoffice/addon-category",
      icon: <TbCategoryPlus />,
    },
    {
      name: "Add-on",
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
  ];

  const warehouseSidebar = [
    {
      name: "Warehouse",
      route: "/warehouse",
      icon: <MdOutlineInventory />,
    },
    {
      name: "Warehouse Item",
      route: "/warehouse/warehouse-item",
      icon: <MdFoodBank />,
    },
    {
      name: "Ingredient",
      route: "/warehouse/item-ingredient",
      icon: <GiMeal />,
    },
    {
      name: "Add-on Ingredient",
      route: "/warehouse/addon-ingredient",
      icon: <MdOutlineFastfood />,
    },
    {
      name: "Supplier",
      route: "/warehouse/supplier",
      icon: <IoIosPeople />,
    },
    {
      name: "Purchase Order",
      route: "/warehouse/purchase-order",
      icon: <TbShoppingCartDollar />,
    },
    {
      name: "Stock",
      route: "/warehouse/stock",
      icon: <BiBox />,
    },
    {
      name: "Stock Movement",
      route: "/warehouse/stock-movement",
      icon: <LuGitCompareArrows />,
    },
  ];

  const sideBarItem: SideBarItem[] = [
    ...(isFromWarehouse ? warehouseSidebar : backOfficeSidebar),
    {
      name: "Audit Log",
      route: "/warehouse/audit-log",
      icon: <AiOutlineAudit />,
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
        className={`bg-background shadow-sm rounded-md overflow-y-auto scrollbar-hide
    transition-all
    absolute top-[70px] bottom-0 left-1 z-30 m-1
    lg:static lg:top-auto lg:bottom-auto lg:left-auto
    ${sideBarOpen ? "w-52 lg:w-64" : "w-0 lg:w-16 2xl:w-56"}
  `}
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
                    <div
                      className={`transition-size ${
                        sideBarOpen ? "mr-1 text-2xl" : "text-3xl"
                      }`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </div>
                    <div
                      className={`flex justify-between w-full items-center ml-1 text-sm ${
                        sideBarOpen ? "flex" : "hidden 2xl:flex"
                      }`}
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
