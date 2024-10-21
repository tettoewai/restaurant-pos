"use client";
import { fetchCompany, fetchTableWithId } from "@/app/lib/backoffice/data";
import { OrderContext } from "@/context/OrderContext";
import { Badge, Tooltip } from "@nextui-org/react";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { MdShoppingCart } from "react-icons/md";
import useSWR from "swr";
import SidebarOrder from "./SidebarOrder";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const TopBarOrder = () => {
  const searchParams = useSearchParams();
  const { carts } = useContext(OrderContext);
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const [tableId, setTableId] = useState<string>("");

  // Use useEffect to capture the query params after the initial render
  useEffect(() => {
    const idFromParams = searchParams.get("tableId");
    if (idFromParams) {
      setTableId(idFromParams);
    }
  }, [searchParams]);

  // Fetch the table and company data
  const fetchAllData = async () => {
    const [company, table] = await Promise.all([
      fetchCompany(),
      fetchTableWithId(Number(tableId)),
    ]);
    return { company, table };
  };

  // Only fetch data when tableId is available
  const { data, error } = useSWR(
    tableId ? `data-${tableId}` : null,
    fetchAllData
  );

  if (error) {
    console.error("Error fetching data:", error);
    return <div>Error fetching data</div>;
  }

  const company = data?.company;
  const table = data?.table;

  return (
    <>
      <div className="w-full bg-background h-16 rounded-md flex items-center justify-between fixed top-0 left-0 right-0 m-auto z-20">
        <button
          type="button"
          className="w-10 h-10 cursor-pointer m-1 items-center p-1 text-primary"
          onClick={() => setSideBarOpen(!sideBarOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {sideBarOpen ? (
            <IoClose className="w-full h-full" />
          ) : (
            <IoMenu className="w-full h-full" />
          )}
        </button>
        <span className={bebasNeue.className}>
          {company?.name}
          {table?.name && ` | ${table.name}`}
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
              content={carts.length}
              isInvisible={carts.length === 0}
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
      <SidebarOrder
        sideBarOpen={sideBarOpen}
        setSideBarOpen={setSideBarOpen}
        tableId={tableId}
      />
    </>
  );
};

export default TopBarOrder;
