"use client";

import { Tooltip } from "@heroui/react";
import {
  AddSquare,
  BoxMinimalistic,
  Cart,
  Garage,
  MapPoint,
  PresentationGraph,
  RecordSquare,
  SettingsMinimalistic,
  SquareTransferHorizontal,
  UsersGroupTwoRounded,
  Widget,
  WidgetAdd,
} from "@solar-icons/react";
import {
  Beef,
  HandPlatter,
  Megaphone,
  Salad,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
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
  const backOfficeSidebar = [
    {
      name: "Order",
      route: "/secure/backoffice/order",
      icon: <Salad />,
    },
    {
      name: "Dashboard",
      route: "/secure/backoffice/dashboard",
      icon: <PresentationGraph />,
    },
    {
      name: "Menu category",
      route: "/secure/backoffice/menu-category",
      icon: <Widget />,
    },
    { name: "Menu", route: "/secure/backoffice/menu", icon: <HandPlatter /> },
    {
      name: "Add-on Category",
      route: "/secure/backoffice/addon-category",
      icon: <WidgetAdd />,
    },
    {
      name: "Add-on",
      route: "/secure/backoffice/addon",
      icon: <AddSquare />,
    },
    {
      name: "Table",
      route: "/secure/backoffice/table",
      icon: (
        <Image
          priority
          src="table.svg"
          height={10}
          width={10}
          alt="Table Icon"
        />
      ),
    },
    {
      name: "Location",
      route: "/secure/backoffice/location",
      icon: <MapPoint />,
    },
    {
      name: "Promotion",
      route: "/secure/backoffice/promotion",
      icon: <Megaphone />,
    },
  ];

  const warehouseSidebar = [
    {
      name: "Warehouse",
      route: "/secure/warehouse",
      icon: <Garage />,
    },
    {
      name: "Warehouse Item",
      route: "/secure/warehouse/warehouse-item",
      icon: <Utensils />,
    },
    {
      name: "Ingredient",
      route: "/secure/warehouse/item-ingredient",
      icon: <Beef />,
    },
    {
      name: "Add-on Ingredient",
      route: "/secure/warehouse/addon-ingredient",
      icon: <UtensilsCrossed />,
    },
    {
      name: "Supplier",
      route: "/secure/warehouse/supplier",
      icon: <UsersGroupTwoRounded />,
    },
    {
      name: "Purchase Order",
      route: "/secure/warehouse/purchase-order",
      icon: <Cart />,
    },
    {
      name: "Stock",
      route: "/secure/warehouse/stock",
      icon: <BoxMinimalistic />,
    },
    {
      name: "Stock Movement",
      route: "/secure/warehouse/stock-movement",
      icon: <SquareTransferHorizontal />,
    },
  ];

  const pathName = usePathname();
  const router = useRouter();

  const sideBarItem: SideBarItem[] = [
    ...(pathName.split("/")[2] === "warehouse"
      ? warehouseSidebar
      : backOfficeSidebar),
    {
      name: "Audit Log",
      route: "/secure/warehouse/audit-log",
      icon: <RecordSquare />,
    },
    {
      name: "Setting",
      route: `/secure/${pathName.split("/")[2]}/setting`,
      icon: <SettingsMinimalistic />,
    },
  ];

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
              pathName.split("/")[3] === item.route.split("/")[3];
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
