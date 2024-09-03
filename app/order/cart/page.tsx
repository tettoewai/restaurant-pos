"use client";

import { OrderContext } from "@/context/OrderContext";
import { Button, Card } from "@nextui-org/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import { BsCartX } from "react-icons/bs";
import useSWR from "swr";
import ConfirmOrderBut from "../components/ConfirmOrderBut";
import MenuForCart from "../components/MenuForCart";
import { fetchMenuWithIds, fetchAddonWithIds } from "@/app/lib/backoffice/data";
import { Menu } from "@prisma/client";

export default function Cart() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const { carts, setCarts } = useContext(OrderContext);
  const validMenuIds = carts.map((item) => item.menuId);
  const validAddons = carts.map((item) => item.addons);
  const uniqueAddons = Array.from(new Set(validAddons.flat()));
  const menuFetcher = () => fetchMenuWithIds(validMenuIds).then((res) => res);
  const addonFetcher = () => fetchAddonWithIds(uniqueAddons).then((res) => res);

  const fetchAllData = () =>
    Promise.all([menuFetcher(), addonFetcher()]).then(([menus, addons]) => ({
      menus,
      addons,
    }));

  const { data, error } = useSWR(
    carts.length > 0 ? "menu-and-addon" : null,
    fetchAllData
  );
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
              .map((item, index) => {
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
                You haven't added anything to your cart!
              </span>
              <Link href={`/order?tableId=${tableId}`}>
                <Button className="bg-primary mt-4 text-white">Browse</Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
      {carts.length > 0 ? <ConfirmOrderBut /> : null}
    </div>
  );
}
