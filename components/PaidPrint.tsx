"use client";
import {
  fetchCompany,
  fetchSelectedLocation,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { dateToString } from "@/function";
import { Card, Input } from "@nextui-org/react";
import { Addon, Menu } from "@prisma/client";
import { nanoid } from "nanoid";
import Image from "next/image";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useState,
} from "react";
import useSWR from "swr";

interface Props {
  tableId: number;
  receiptCode?: string;
  menus: Menu[] | undefined;
  addons: Addon[] | undefined;
  componentRef: RefObject<HTMLDivElement>;
  subTotal: number;
  taxRate: number;
  setTaxRate: Dispatch<SetStateAction<number>>;
  qrCodeImage: string | null | undefined;
}

function PaidPrint({
  tableId,
  receiptCode,
  menus,
  addons,
  componentRef,
  subTotal,
  taxRate,
  setTaxRate,
  qrCodeImage,
}: Props) {
  const { paid, setPaid } = useContext(BackOfficeContext);

  const { data: company } = useSWR("company", () =>
    fetchCompany().then((res) => res)
  );
  const { data: location } = useSWR("location", () =>
    fetchSelectedLocation().then((res) => res)
  );
  const { data: table } = useSWR([tableId], () =>
    fetchTableWithId(tableId).then((res) => res)
  );

  const date = new Date();
  const tax = subTotal * (taxRate / 100);
  const total = subTotal + tax;

  return (
    <Card
      ref={componentRef}
      className="w-[320px] bg-white p-4 text-sm font-mono text-black"
    >
      <div>#{receiptCode}</div>
      <div className="text-center border-b pb-4 mb-4">
        <h2 className="font-bold text-lg">{company?.name}</h2>
        {location && (
          <p className="text-gray-500">
            {location.street + ", " + location.township + ", " + location.city}
          </p>
        )}
        <p className="text-gray-500">Tel: +123-456-789</p>
      </div>
      <div className="flex justify-between mb-2">
        <span>Table:</span>
        <span>{table?.name}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Date:</span>
        <span>{dateToString({ date: date, type: "DMY" })}</span>
      </div>

      <table className="w-full text-left mb-4">
        <thead>
          <tr className="border-b">
            <th className="py-1">Item</th>
            <th className="py-1">Qty</th>
            <th className="py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {paid.map((item, index) => {
            const validMenu = menus?.find((menu) => menu.id === item.menuId);
            const paidAddons: number[] = item.addons
              ? JSON.parse(item.addons)
              : [];
            const validAddon = addons?.filter((addon) =>
              paidAddons.includes(addon.id)
            );
            const currentAddonPrice = validAddon?.reduce(
              (accu, curr) => curr.price + accu,
              0
            );
            const currentTotalPrice =
              currentAddonPrice && validMenu && item.quantity
                ? (validMenu.price + currentAddonPrice) * item.quantity
                : validMenu && item.quantity
                ? validMenu.price * item.quantity
                : 0;
            return (
              <tr className="border-b" key={index}>
                <td className="text-wrap">
                  <span className="text-wrap">
                    {validAddon && validAddon.length > 0
                      ? validMenu?.name +
                        `(${validAddon?.map((item) => item.name).join(", ")})`
                      : validMenu?.name}
                  </span>
                </td>
                <td>{item.quantity}</td>
                <td>{currentTotalPrice} Ks</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between py-1 border-t border-b mb-2">
        <span>Sub Total:</span>
        <span>{subTotal} Ks</span>
      </div>

      {/* Tax rate input controlled by user */}
      <div className="flex justify-between py-1 border-b mb-2">
        <span className="flex items-center">
          Tax :
          <Input
            variant="bordered"
            type="number"
            color="primary"
            value={String(taxRate)}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 0 && value <= 100) {
                setTaxRate(value);
              }
            }}
            className="w-fit ml-1 hide-in-print"
            min={0}
            max={100}
            endContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">%</span>
              </div>
            }
          />
        </span>
        <span>{tax.toFixed(2)} Ks</span>
      </div>

      <div className="flex justify-between py-1 border-b mb-2 font-bold">
        <span>Total:</span>
        <span>{total.toFixed(2)} Ks</span>
      </div>

      <div className="text-center my-4">
        <Image
          className="mx-auto mb-2"
          src={
            qrCodeImage
              ? qrCodeImage
              : "https://via.placeholder.com/100x100.png?text=QR+Code"
          }
          alt="QR Code"
          width={100}
          height={100}
        />
        <p className="text-xs text-gray-500">
          Scan for digital receipt or feedback
        </p>
      </div>

      <div className="text-center text-gray-600 text-xs">
        <p>Thank you for your purchase!</p>
        <p>Please come again.</p>
      </div>
    </Card>
  );
}

export default PaidPrint;
