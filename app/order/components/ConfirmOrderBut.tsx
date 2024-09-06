"use client";
import { fetchMenuWithIds, fetchAddonWithIds } from "@/app/lib/backoffice/data";
import { createOrder } from "@/app/lib/order/action";
import { OrderContext } from "@/context/OrderContext";
import { Button } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import useSWR from "swr";

export default function ConfirmOrderBut() {
  const { carts, setCarts } = useContext(OrderContext);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId") as string;
  const validAddons = carts.map((item) => item.addons);
  const uniqueAddons = Array.from(new Set(validAddons.flat()));

  const menuFetcher = () =>
    fetchMenuWithIds(carts.map((item) => item.menuId)).then((res) => res);

  const addonFetcher = () => fetchAddonWithIds(uniqueAddons).then((res) => res);

  const fetchAllData = () =>
    Promise.all([menuFetcher(), addonFetcher()]).then(([menus, addons]) => ({
      menus,
      addons,
    }));
  const { data, error } = useSWR("menu-and-addon", fetchAllData);

  const menuPrices = carts.map((item) => {
    const validMenuPrice = data?.menus.find(
      (menu) => menu.id === item.menuId
    )?.price;
    if (validMenuPrice) return validMenuPrice * item.quantity;
    return 0;
  });
  const addonPrices = carts.map((item) => {
    const validAddons = data?.addons.filter((addon) =>
      item.addons.includes(addon.id)
    );
    const addonPrice = validAddons?.reduce(
      (accumulator, current) => accumulator + current.price,
      0
    );
    return addonPrice && addonPrice * item.quantity;
  });
  const totalAddonPrice = addonPrices
    .filter((item) => item !== undefined)
    .reduce((accumulator, current) => accumulator + current, 0);
  const totalMenuPrices = menuPrices.reduce(
    (accumulator, current) => accumulator + current,
    0
  );
  const handleConfirmOrder = () => {
    createOrder({ tableId: Number(tableId), cartItem: carts }).then(() =>
      setCarts([])
    );
  };

  return (
    <div className="fixed bottom-0 right-0 left-0 m-auto bg-background p-2 rounded-t-md flex flex-col">
      <div className="flex justify-between">
        <span>Total: </span>
        <span>{totalAddonPrice + totalMenuPrices} Ks</span>
      </div>
      <Button
        color="primary"
        className="text-white mt-1"
        onClick={handleConfirmOrder}
      >
        Confirm Order
      </Button>
    </div>
  );
}
