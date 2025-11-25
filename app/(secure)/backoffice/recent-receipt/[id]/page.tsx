import { generateQRCode } from "@/app/lib/backoffice/action";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import { fetchReceiptWithCode } from "@/app/lib/order/data";
import ListTable from "@/components/ListTable";
import { config } from "@/config";
import {
  convertMyanmarTime,
  dateToString,
  formatCurrency,
  formatReceipt,
} from "@/function";
import { Card } from "@heroui/react";
import Image from "next/image";

export default async function RecentReceipt({
  params,
}: {
  params: { id: string };
}) {
  const receipt = await fetchReceiptWithCode(params.id);
  if (!receipt?.length) {
    return (
      <div>
        <span>There is no receipt.</span>
      </div>
    );
  }

  const tableId = receipt.length ? receipt[0].tableId : 0;
  const table = await fetchTableWithId(tableId);
  const tableName = table ? table.name : "";

  const menuIds = receipt.length ? receipt.map((item) => item.menuId) : [];
  const menus = menuIds.length ? await fetchMenuWithIds(menuIds) : [];

  const addonIds = receipt.length
    ? receipt.map((item) => item.addonId).filter((item) => item !== null)
    : [];
  const addons = addonIds.length ? await fetchAddonWithIds(addonIds) : [];

  const addonCategoryIds = addons.length
    ? addons.map((item) => item.addonCategoryId)
    : [];
  const addonCategories = addonCategoryIds.length
    ? await fetchAddonCategoryWithIds(addonCategoryIds)
    : [];

  const digitalReceiptUrl = `${config.digitalReceiptUrl}/${params.id}`;

  const qrCodeImage = (await generateQRCode(digitalReceiptUrl)) || "";

  const receiptData = formatReceipt(receipt);

  const nowMyanmarDate = dateToString({
    date: convertMyanmarTime(receipt[0].date),
    type: "DMY",
    withHour: true,
  });

  const columns = [
    { key: "key", label: "No." },
    { key: "menu", label: "Menu" },
    { key: "addon", label: "Addon" },
    { key: "quantity", label: "Quantity" },
    { key: "price", label: "Price" },
  ];

  let subTotal = 0;

  const rows = receiptData.map((receipt, index) => {
    subTotal += receipt.isFoc ? 0 : receipt.subTotal;
    const validMenu =
      menus.find((item) => item.id === receipt.menuId)?.name || "";
    const validAddon = addons
      .filter((item) => receipt.addons.includes(item.id))
      .map((item) => {
        const validAddonCategory = addonCategories?.find(
          (category) => category.id === item.addonCategoryId
        );
        return `${validAddonCategory?.name} - ${item.name}`;
      })
      .join(", ");
    return {
      key: index + 1,
      menu: validMenu,
      addon: validAddon || "--",
      quantity: receipt.quantity || 0,
      price: receipt.isFoc ? 0 : formatCurrency(receipt.subTotal),
    };
  });

  return (
    <div>
      <Card className="p-2 bg-background pb-4">
        <div className="w-full flex justify-end items-center">
          <span>Date : {nowMyanmarDate}</span>
        </div>
        <div className="w-full flex justify-between">
          <span>Code : {params.id}</span>
          <span className="font-bold">Table : {tableName}</span>
          <Image src={qrCodeImage} alt="QR Code" width={100} height={100} />
        </div>
        <div>
          <ListTable columns={columns} rows={rows} />
          <div className="w-full flex-col flex items-end justify-end pr-16">
            <div className="flex justify-between  min-w-56">
              <h3>Sub total : </h3>
              <h3>{formatCurrency(subTotal)}</h3>
            </div>
            {receipt[0].discount ? (
              <div className="flex justify-between min-w-56">
                <h3>Discount : </h3>
                <h3>-{formatCurrency(receipt[0].discount)}</h3>
              </div>
            ) : null}
            <div className="flex justify-between min-w-56">
              <h3>Net total : </h3>
              <h3>
                {formatCurrency(
                  Math.max(subTotal - (receipt[0].discount || 0), 0)
                )}
              </h3>
            </div>
            <div className="flex justify-between min-w-56">
              <h3>Tax : </h3> <h3>{formatCurrency(receipt[0].tax)}</h3>
            </div>
            <div className="flex justify-between min-w-56">
              <h3>Total : </h3> <h3>{formatCurrency(receipt[0].totalPrice)}</h3>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
