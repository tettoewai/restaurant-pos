"use client";
import { fetchCompany, fetchTableWithId } from "@/app/lib/backoffice/data";
import { OrderContext } from "@/context/OrderContext";
import { Badge, Tooltip } from "@nextui-org/react";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { IoMenu } from "react-icons/io5";
import { MdShoppingCart } from "react-icons/md";
import useSWR from "swr";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const TopBarOrder = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const { carts } = useContext(OrderContext);

  const companyFetcher = () => fetchCompany().then((res) => res);
  const tableFetcher = () =>
    fetchTableWithId(Number(searchParams.get("tableId"))).then((res) => res);
  const fetchAllData = () =>
    Promise.all([companyFetcher(), tableFetcher()]).then(
      ([company, table]) => ({
        company,
        table,
      })
    );
  const { data, error } = useSWR("company and table", fetchAllData);

  return (
    <div className="w-full bg-background h-16 rounded-md flex items-center justify-between fixed top-0 left-0 right-0 m-auto z-20">
      <button
        type="button"
        className="flex lg:hidden w-10 h-10 cursor-pointer m-1 items-center p-1 text-primary"
      >
        <span className="sr-only">Open sidebar</span>
        <IoMenu className="w-full h-full" />
      </button>
      <span className={bebasNeue.className}>
        {data?.company?.name}
        {data?.table?.name && ` | ${data.table.name}`}
      </span>
      <Tooltip
        placement="bottom-end"
        content="cart"
        className="text-primary"
        showArrow={true}
        delay={1000}
      >
        <Link href={`/order/cart/?tableId=${tableId}`}>
          <Badge
            content={carts.length > 0 && carts.length}
            color="primary"
            className="text-white"
            placement="top-left"
            shape="rectangle"
          >
            <button className="w-10 mr-2">
              <MdShoppingCart className="flex size-8 cursor-pointer m-1 items-center p-1 text-primary" />
            </button>
          </Badge>
        </Link>
      </Tooltip>
    </div>
  );
};

export default TopBarOrder;
