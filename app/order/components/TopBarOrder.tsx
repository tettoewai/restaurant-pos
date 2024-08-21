"use client";
import { fetchCompany, fetchTableWithId } from "@/app/lib/data";
import { Kanit } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoMenu } from "react-icons/io5";
import { MdShoppingCart } from "react-icons/md";

const kanit = Kanit({ subsets: ["latin"], weight: "500" });

const TopBarOrder = () => {
  const [topBarData, setTopBarData] = useState<{
    companyName?: string;
    tableName?: string;
  }>({
    companyName: "",
    tableName: "",
  });
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");

  useEffect(() => {
    const getData = async () => {
      const companyName = (await fetchCompany())?.name;
      const tableName = (
        await fetchTableWithId(Number(searchParams.get("tableId")))
      )?.name;
      setTopBarData({ companyName, tableName });
    };
    getData();
  }, [tableId]);
  return (
    <div className="w-full bg-background h-16 rounded-md flex items-center justify-between fixed top-0 z-20">
      <button
        type="button"
        className="flex lg:hidden w-10 h-10 cursor-pointer m-1 items-center p-1 text-primary"
      >
        <span className="sr-only">Open sidebar</span>
        <IoMenu className="w-full h-full" />
      </button>
      <span className={`${kanit.className} text-primary`}>
        {topBarData.companyName}{" "}
        {topBarData.tableName && ` | ${topBarData.tableName}`}
      </span>
      <button className="w-10">
        <MdShoppingCart className="flex size-8 cursor-pointer m-1 items-center p-1 text-primary" />
      </button>
    </div>
  );
};

export default TopBarOrder;
