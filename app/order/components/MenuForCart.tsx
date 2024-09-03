"use client";
import { CartItem, OrderContext } from "@/context/OrderContext";
import { Card } from "@nextui-org/react";
import { Addon, Menu } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import { MdAttachMoney, MdEdit } from "react-icons/md";

interface Props {
  itemId: string;
  menu: Menu;
  addons?: Addon[];
  carts: CartItem[];
  setCarts: Dispatch<SetStateAction<CartItem[]>>;
}

export default function MenuForCart({
  menu,
  addons,
  itemId,
  carts,
  setCarts,
}: Props) {
  const validCart = carts.find((item) => item.id === itemId) as CartItem;
  const otherCart = carts.filter((item) => item.id !== itemId);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");

  const validAddons = addons?.filter((item) =>
    validCart.addons.includes(item.id)
  );

  const addonPrice = validAddons?.reduce(
    (accumulator, current) => accumulator + current.price,
    0
  );
  if (!menu) return null;
  const menuPrice = addonPrice
    ? (menu.price + addonPrice) * validCart.quantity
    : menu.price * validCart.quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      const updatedCart = carts.filter((item) => item.id !== itemId);
      setCarts(updatedCart);
    } else {
      const updatedCart = [
        { ...validCart, quantity: newQuantity },
        ...otherCart,
      ];
      setCarts(updatedCart);
    }
  };

  return (
    <Card className="h-32 mb-3">
      <Link
        href={`/order/${validCart.menuId}?tableId=${tableId}&cartId=${validCart.id}`}
      >
        <button className="absolute top-2 right-2">
          <MdEdit className="size-6 text-primary" />
        </button>
      </Link>
      <div className="flex flex-row items-center h-full">
        <div className="w-2/6 overflow-hidden h-full flex justify-center items-center">
          <Image
            src={menu?.assetUrl || "/default-menu.png"}
            alt="menu image"
            width={500}
            height={500}
            className="h-full object-cover"
          />
        </div>
        <div className="m-2 flex flex-col space-y-1 h-full items-start justify-center">
          <div className="space-y-2 mb-4">
            <span className="font-semibold">{menu.name}</span>
            <div className="flex">
              <span className="text-xs">
                {validAddons?.map((item) => item.name).join(", ")}
              </span>
            </div>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => handleQuantityChange(validCart.quantity - 1)}
            >
              <CiCircleMinus className="size-6 text-primary" />
            </button>
            <div className="px-5 rounded-md flex justify-center items-center text-lg h-full bg-gray-200 dark:bg-gray-900">
              {validCart.quantity}
            </div>
            <button
              onClick={() => handleQuantityChange(validCart.quantity + 1)}
            >
              <CiCirclePlus className="size-6 text-primary" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center mr-1">
          <MdAttachMoney className="text-xl text-primary" />
          <span className=" text-sm">{menuPrice} Ks</span>
        </div>
      </div>
    </Card>
  );
}
