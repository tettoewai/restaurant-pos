import {
  fetchRecentReceipt,
  fetchTableWithIds,
} from "@/app/lib/backoffice/data";
import ReceiptTable from "@/components/ReceiptTable";
import { dateToString, formatCurrency } from "@/function";
import { Button, Link as NextUiLink } from "@heroui/react";
import Link from "next/link";
import { FaRegEye } from "react-icons/fa6";
import { GrPrint } from "react-icons/gr";

export default async function recentReceiptPage() {
  const receipts = await fetchRecentReceipt();

  const tableIds = receipts.length ? receipts.map((item) => item.tableId) : [];
  const tables = tableIds.length ? await fetchTableWithIds(tableIds) : [];

  const columns = [
    { key: "key", label: "No.", sortable: true },
    { key: "code", label: "Code", sortable: true },
    { key: "table", label: "Table", sortable: true },
    { key: "totalPrice", label: "Total Price", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "action", label: "Action" },
  ];

  const uniqueRecieptCode = receipts.reduce((accu: string[], curr) => {
    if (!accu.includes(curr.code)) {
      accu.push(curr.code);
    }
    return accu;
  }, []);

  const rows = uniqueRecieptCode.map((receiptCode, index) => {
    const receipt = receipts.find((item) => item.code === receiptCode);
    const tableName =
      receipt && receipt.tableId
        ? tables.find((item) => item.id === receipt.tableId)?.name
        : "";
    const menuIds = receipts
      .filter((item) => item.code === receiptCode)
      .map((item) => item.menuId);

    return {
      key: index + 1,
      code: receiptCode,
      table: tableName || "",
      totalPrice:
        receipt && receipt.totalPrice
          ? formatCurrency(receipt.totalPrice) +
            " " +
            `tax-(${formatCurrency(receipt.tax)})`
          : "",
      date:
        receipt && receipt.date
          ? dateToString({ date: receipt.date, type: "DMY" })
          : "",
      action: (
        <div className="space-x-2">
          <NextUiLink
            as={Link}
            href={`/backoffice/recent-receipt/${receiptCode}`}
            color="primary"
            className="hover:bg-default-100 p-[8px] rounded-md"
          >
            <FaRegEye className="size-6" />
          </NextUiLink>
          <Button isIconOnly variant="light">
            <GrPrint className="size-6 text-success" />
          </Button>
        </div>
      ),
    };
  });

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Recent Receipt</span>
        <span className="text-sm text-gray-600">Review receipt and print.</span>
      </div>
      <div className="mt-2">
        <ReceiptTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}
