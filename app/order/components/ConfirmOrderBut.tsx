"use client";
import { createOrder } from "@/app/lib/order/action";
import { CartItem, OrderContext } from "@/context/OrderContext";
import { formatCurrency } from "@/function";
import { Button, Spinner, addToast } from "@heroui/react";
import { Addon, Menu } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

export default function ConfirmOrderBut({
  tableId,
  menus,
  addons,
}: {
  tableId: string;
  menus: Menu[];
  addons: Addon[];
}) {
  const { carts, setCarts } = useContext(OrderContext);
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);

  const menuPrices = carts.map((item) => {
    const validMenuPrice = menus.find((menu) => menu.id === item.menuId)?.price;
    if (validMenuPrice) return validMenuPrice * item.quantity;
    return 0;
  });
  const addonPrices = carts.map((item) => {
    const validAddons = addons.filter((addon) =>
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
    const cartWithSubTotal = carts.reduce((acc: CartItem[], cur) => {
      const addonPrice = addons
        .filter((item) => cur.addons.find((id) => item.id === id))
        .reduce((acc, cur) => {
          return acc + cur.price;
        }, 0);
      const currentMenu = menus.find((item) => item.id === cur.menuId);
      const subTotal =
        addonPrice && currentMenu
          ? (currentMenu.price + addonPrice) * cur.quantity
          : currentMenu
          ? currentMenu.price * cur.quantity
          : 0;
      acc.push({ ...cur, subTotal });
      return acc;
    }, []);
    const { isSuccess, message } = await createOrder({
      tableId: Number(tableId),
      cartItem: cartWithSubTotal,
    });
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      setIsCreating(false);
      setCarts([]);
      router.push(`/order/active-order?tableId=${tableId}`);
    } else {
      setIsCreating(false);
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
        onPress={handleConfirmOrder}
        disabled={isCreating}
      >
        {isCreating ? <Spinner color="white" size="sm" /> : "Confirm Order"}
      </Button>
    </div>
  );
}
