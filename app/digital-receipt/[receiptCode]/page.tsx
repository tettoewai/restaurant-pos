import {
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import {
  fetchCompanyFromOrder,
  fetchReceiptWithCode,
} from "@/app/lib/order/data";
import Feedback from "@/components/Feedback";
import { formatCurrency } from "@/components/fromatCurrency";
import { Card } from "@nextui-org/react";
import { Receipt } from "@prisma/client";
import { ToastContainer } from "react-toastify";

const formatReceipt = (receipts: Receipt[]) => {
  const uniqueItem = [] as string[];
  receipts.map((receipt) => {
    const isExist = uniqueItem.find((item) => item === receipt.itemId);
    if (!isExist) uniqueItem.push(receipt.itemId);
  });
  return uniqueItem.map((item) => {
    const validReceipts = receipts.find((receipt) => receipt.itemId === item);
    const validReceipt = receipts.filter((receipt) => receipt.itemId === item);
    const addonIds = validReceipt
      .map((receipt) => receipt.addonId)
      .filter((item) => item !== null);
    if (addonIds.length > 0) {
      return {
        menuId: validReceipts?.menuId,
        quantity: validReceipts?.quantity,
        addons: addonIds.length > 0 ? JSON.stringify(addonIds) : "",
      };
    } else {
      return {
        menuId: validReceipts?.menuId,
        quantity: validReceipts?.quantity,
      };
    }
  });
};

async function DigitalReceiptPage({
  params,
}: {
  params: { receiptCode: string };
}) {
  const receiptCode = params.receiptCode;
  const receipts = await fetchReceiptWithCode(receiptCode);
  if (!receipts?.length) return <span>There is no receipt</span>;
  const company = await fetchCompanyFromOrder(receipts[0].tableId);
  const table = await fetchTableWithId(receipts[0].tableId);
  const receiptData = formatReceipt(receipts);
  const menuIds = receiptData
    .map((item) => item.menuId)
    .filter((item) => item !== undefined);
  const menus = menuIds && (await fetchMenuWithIds(menuIds));

  const addonIdString = JSON.stringify(
    receiptData
      .map((receipt) => receipt.addons && JSON.parse(receipt.addons))
      .filter((receipt) => receipt !== undefined)
  );

  const addonIds = JSON.parse(addonIdString);
  const uniqueAddonIds: number[] = Array.from(new Set(addonIds?.flat()));

  const addons = await fetchAddonWithIds(uniqueAddonIds);

  let subTotal = 0;

  return (
    <div className="flex flex-col max-w-md mx-auto h-screen">
      <Card className="mt-2 p-2 mx-1 bg-background">
        <div>#{receiptCode}</div>
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="font-bold text-lg text-primary">{company?.name}</h2>
          {<p className="text-gray-500">123 Main St, City, State</p>}
          <p className="text-gray-500">Tel: +123-456-789</p>
        </div>
        <div className="flex justify-between mb-2">
          <span>Table:</span>
          <span>{table?.name}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Date:</span>
          <span>
            {receipts[0].date.getDate() +
              "-" +
              (receipts[0].date.getMonth() + 1) +
              "-" +
              receipts[0].date.getFullYear()}
          </span>
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
            {receiptData.map((item, index) => {
              const validMenu = menus.find((menu) => menu.id === item.menuId);
              const addonIds: number[] = item.addons
                ? JSON.parse(item.addons)
                : [];

              const validAddons = addons.filter((addon) =>
                addonIds.includes(addon.id)
              );
              const addonPrice = validAddons
                .map((addon) => addon.price)
                .reduce((accu, curr) => accu + curr, 0);
              const currentPrice =
                validAddons.length > 0 && validMenu && item.quantity
                  ? (validMenu.price + addonPrice) * item.quantity
                  : validMenu && item.quantity
                  ? validMenu.price * item.quantity
                  : 0;

              subTotal += currentPrice;

              return (
                <tr key={index} className="border-b">
                  <td>
                    <span className="text-wrap">{validMenu?.name}</span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(currentPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between py-1 border-t border-b mb-2">
          <span>Sub Total:</span>
          <span>{formatCurrency(subTotal)}</span>
        </div>

        <div className="flex justify-between py-1 border-b mb-2">
          <span className="flex items-center">Tax :</span>
          <span>{formatCurrency(receipts[0].tax)}</span>
        </div>

        <div className="flex justify-between py-1 border-b mb-2 font-bold">
          <span>Total:</span>
          <span>{formatCurrency(subTotal + receipts[0].tax)}</span>
        </div>
        <div className="text-center text-gray-600 text-xs mt-3">
          <p>Thank you for your purchase!</p>
          <p>Please come again.</p>
        </div>
      </Card>
      <Feedback receiptCode={receiptCode} />
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default DigitalReceiptPage;
