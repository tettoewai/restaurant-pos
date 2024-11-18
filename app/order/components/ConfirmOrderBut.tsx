"use client";
import { fetchAddonWithIds, fetchMenuWithIds } from "@/app/lib/backoffice/data";
import { createOrder } from "@/app/lib/order/action";
import { formatCurrency } from "@/function";
import { OrderContext } from "@/context/OrderContext";
import { Button, Spinner } from "@nextui-org/react";
import { redirect, useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";

export default function ConfirmOrderBut({ tableId }: { tableId: string }) {
  const { carts, setCarts } = useContext(OrderContext);
  const validAddons = carts.map((item) => item.addons);
  const uniqueAddons = Array.from(new Set(validAddons.flat()));

  const router = useRouter();

  const menuFetcher = () =>
    fetchMenuWithIds(carts.map((item) => item.menuId)).then((res) => res);

  const addonFetcher = () => fetchAddonWithIds(uniqueAddons).then((res) => res);
  const [isCreating, setIsCreating] = useState(false);
  const fetchAllData = () =>
    Promise.all([menuFetcher(), addonFetcher()]).then(([menus, addons]) => ({
      menus,
      addons,
    }));
  const { data, error } = useSWR("menu-and-addon", fetchAllData, {
    refreshInterval: 3000, // or any suitable interval
    onLoadingSlow: () => setIsCreating(true),
    onSuccess: () => setIsCreating(false),
  });

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
  const handleConfirmOrder = async () => {
    setIsCreating(true);
    const { isSuccess, message } = await createOrder({
      tableId: Number(tableId),
      cartItem: carts,
    });
    if (isSuccess) {
      setIsCreating(false);
      toast.success(message);
      setCarts([]);
      router.push(`/order/active-order?tableId=${tableId}`);
    } else {
      setIsCreating(false);
      toast.error(message);
    }
  };

  const totalPrice = formatCurrency(
    Math.floor(totalAddonPrice + totalMenuPrices)
  );

  return (
    <div className="fixed bottom-0 right-0 left-0 m-auto bg-background p-2 rounded-t-md flex flex-col">
      <div className="flex justify-between">
        <span>Total: </span>
        <span>{totalPrice}</span>
      </div>
      <Button
        color="primary"
        className="text-white mt-1"
        onClick={handleConfirmOrder}
        disabled={isCreating}
      >
        {isCreating ? <Spinner color="primary" size="sm" /> : "Confirm Order"}
      </Button>
    </div>
  );
}
