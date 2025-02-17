import { fetchMenuWithIds, fetchTableWithId } from "@/app/lib/backoffice/data";
import {
  fetchCompanyFromOrder,
  fetchReceiptWithCode,
} from "@/app/lib/order/data";
import Feedback from "@/components/Feedback";
import { dateToString, formatCurrency, formatReceipt } from "@/function";
import { Card } from "@heroui/react";
import { Receipt } from "@prisma/client";
import { ToastContainer } from "react-toastify";

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

  let subTotal = 0;

  return (
    <div className="flex flex-col max-w-md mx-auto">
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
          <span>{dateToString({ date: receipts[0].date, type: "DMY" })}</span>
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
              const currentPrice = item.subTotal;

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
