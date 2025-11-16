"use client";
import { fetchTableWithId } from "@/app/lib/backoffice/data";
import { fetchCompanyFromOrder } from "@/app/lib/order/data";
import { OrderContext } from "@/context/OrderContext";
import { Badge, Tooltip } from "@heroui/react";
import { Cart, CloseCircle, HamburgerMenu } from "@solar-icons/react/ssr";
import { Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import useSWR from "swr";
import SidebarOrder from "./SidebarOrder";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const TopBarOrder = () => {
  const searchParams = useSearchParams();
  const { carts } = useContext(OrderContext);
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const tableId = searchParams.get("tableId");

  // Fetch the table and company data
  const fetchAllData = async () => {
    const [company, table] = await Promise.all([
      fetchCompanyFromOrder(Number(tableId)),
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

  if (!tableId) return <span>There is no table</span>;

  return (
    <>
      <div className="w-[99%] bg-background h-16 rounded-md flex items-center justify-between fixed mt-0.5 top-0 left-0 right-0 m-auto z-30">
        <button
          type="button"
          className="w-10 h-10 cursor-pointer m-1 items-center p-1 text-primary"
          onClick={() => setSideBarOpen(!sideBarOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {sideBarOpen ? (
            <CloseCircle className="w-full h-full" />
          ) : (
            <HamburgerMenu className="w-full h-full" />
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
                <Cart className="flex size-8 cursor-pointer m-1 items-center p-1 text-primary" />
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
