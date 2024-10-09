"use client";

import { fetchAddonWithIds, fetchMenuWithIds } from "@/app/lib/backoffice/data";
import { OrderContext } from "@/context/OrderContext";
import { Button, Card } from "@nextui-org/react";
import { Menu } from "@prisma/client";
import Link from "next/link";
import { useContext } from "react";
import { BsCartX } from "react-icons/bs";
import useSWR from "swr";
import ConfirmOrderBut from "../components/ConfirmOrderBut";
import MenuForCart from "../components/MenuForCart";
import { useSearchParams } from "next/navigation";

export default function Cart() {
  const { carts, setCarts } = useContext(OrderContext);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId") as string;

  const validMenuIds = carts.map((item) => item.menuId);
  const validAddons = carts.map((item) => item.addons);
  const uniqueAddons = Array.from(new Set(validAddons.flat()));

  const menuFetcher = () =>
    validMenuIds.length ? fetchMenuWithIds(validMenuIds) : Promise.resolve([]);
  const addonFetcher = () =>
    uniqueAddons.length ? fetchAddonWithIds(uniqueAddons) : Promise.resolve([]);

  const fetchAllData = () =>
    Promise.all([menuFetcher(), addonFetcher()]).then(([menus, addons]) => ({
      menus,
      addons,
    }));

  const { data, error } = useSWR([carts], fetchAllData);

  return (
    <div className="px-2">
      <div className="w-full flex justify-between items-center mt-3">
        <div className="flex flex-col pl-2">
          <span className="text-primary">Cart</span>
          <span className="text-sm text-gray-600">
            Manage your cart (If you refresh pages, cart will empty)
          </span>
        </div>
      </div>
      <div className="mt-4">
        {carts.length > 0 ? (
          <div>
            {carts
              .sort((a, b) => Number(a.id) - Number(b.id))
              .map((item) => {
                const validMenu = data?.menus?.find(
                  (menu) => menu.id === item.menuId
                ) as Menu;
                return (
                  <MenuForCart
                    itemId={item.id}
                    key={item.id}
                    menu={validMenu}
                    addons={data?.addons}
                    carts={carts}
                    setCarts={setCarts}
                    tableId={tableId}
                  />
                );
              })}
          </div>
        ) : (
          <div className="flex items-center justify-center mt-36">
            <Card className="bg-background flex flex-col items-center justify-center w-4/5 p-4">
              <BsCartX className="size-12 text-primary mb-4" />
              <span>Hungry?</span>
              <span className="text-sm">
                You have not added anything to your cart!
              </span>
              <Link href={`/order?tableId=${tableId}`}>
                <Button className="bg-primary mt-4 text-white">Browse</Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
      {carts.length > 0 ? <ConfirmOrderBut tableId={tableId} /> : null}
    </div>
  );
}
