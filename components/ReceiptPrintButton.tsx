"use client";
import { generateQRCode } from "@/app/lib/backoffice/action";
import {
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchSelectedLocation,
} from "@/app/lib/backoffice/data";
import { config } from "@/config";
import { dateToString, formatCurrency } from "@/function";

import {
  Button,
  Card,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Company, Receipt } from "@prisma/client";
import { useMemo, useRef } from "react";
import { GrPrint } from "react-icons/gr";
import { useReactToPrint } from "react-to-print";
import useSWR from "swr";
import html2canvas from "html2canvas";

export default function ReceiptPrintButton({
  receipts,
  menuIds,
  addonIds,
  tableName,
  company,
}: {
  receipts: Receipt[];
  menuIds: number[];
  addonIds: number[];
  tableName: string;
  company: Company | null;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const componentRef = useRef<HTMLDivElement>(null);
  const { data: menuData, isLoading: menuLoading } = useSWR(
    isOpen && menuIds.length ? `menus ${JSON.stringify(menuIds)}` : null,
    () => fetchMenuWithIds(menuIds)
  );
  const { data: addonData, isLoading: addonLoading } = useSWR(
    isOpen && addonIds.length ? `addons ${JSON.stringify(addonIds)}` : null,
    () => fetchAddonWithIds(addonIds)
  );

  const receiptUrl = useMemo(
    () =>
      receipts.length > 0 && isOpen
        ? `${config.digitalReceiptUrl}/${receipts[0].code}`
        : "",
    [isOpen, receipts]
  );

  const { data: qrCodeData, isLoading: qrCodeLoading } = useSWR(
    receiptUrl && isOpen ? `qrCodeData -${receiptUrl}` : null,
    () => generateQRCode(receiptUrl)
  );

  const { data: location } = useSWR(isOpen ? "location" : null, () =>
    fetchSelectedLocation()
  );

  const subTotal = receipts
    .filter((item) => !item.isFoc)
    .reduce((accu, curr) => {
      const validMenu = menuData?.find((item) => item.id === curr.menuId);
      const paidAddonPrices = addonData?.reduce(
        (accu, curr) => curr.price + accu,
        0
      );
      if (!curr.quantity) return 0;
      const totalPrice =
        paidAddonPrices && validMenu
          ? (validMenu.price + paidAddonPrices) * curr.quantity + accu
          : validMenu
          ? validMenu.price * curr.quantity + accu
          : 0;
      return totalPrice;
    }, 0);

  const printReceipt = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Print Receipt",
  });

  const downloadReceipt = async () => {
    if (!componentRef.current) return;

    const canvas = await html2canvas(componentRef.current, {
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.scrollHeight,
    });

    const image = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    link.href = image;
    link.download = `${receipts[0].code} Receipt ${dateToString({
      date: receipts[0].date,
      type: "DMY",
    })}`;
    link.click();
  };

  return (
    <>
      <Button isIconOnly variant="light" onPress={onOpen}>
        <GrPrint className="size-6 text-success" />
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col text-center">
            Print Receipt
          </ModalHeader>
          <ModalBody className="max-h-96 flex justify-center items-center">
            {menuLoading && addonLoading && qrCodeLoading ? (
              <Spinner size="sm" />
            ) : (
              <Card
                ref={componentRef}
                shadow="none"
                radius="none"
                className="w-[320px] p-4 text-sm font-mono text-black bg-white"
                style={{
                  overflow: "visible",
                  height: "auto",
                  marginTop: "300px",
                }}
              >
                <div>#{receipts[0].code}</div>
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="font-bold text-lg">{company?.name}</h2>
                  {location && (
                    <p className="text-gray-500">
                      {location.street +
                        ", " +
                        location.township +
                        ", " +
                        location.city}
                    </p>
                  )}
                  <p className="text-gray-500">Tel: +123-456-789</p>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Table:</span>
                  <span>{tableName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Date:</span>
                  <span>
                    {dateToString({ date: receipts[0].date, type: "DMY" })}
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
                    {receipts.map((item, index) => {
                      const validMenu = menuData?.find(
                        (menu) => menu.id === item.menuId
                      );
                      const menuName = item.isFoc
                        ? `${validMenu?.name} (FOC)`
                        : validMenu?.name;
                      return (
                        <tr className="border-b" key={index}>
                          <td className="text-wrap max-w-28">
                            <span>
                              {addonData && addonData.length > 0
                                ? menuName +
                                  `(${addonData
                                    ?.map((item) => item.name)
                                    .join(", ")})`
                                : menuName}
                            </span>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">
                            {item.isFoc
                              ? 0
                              : item.subTotal
                              ? formatCurrency(item.subTotal)
                              : 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-between py-1 border-t border-b mb-2">
                  <span>Sub Total:</span>
                  <span>{subTotal}</span>
                </div>

                {/* Tax rate input controlled by user */}
                <div className="flex justify-between py-1 border-b mb-2">
                  <span className="flex items-center">Tax :</span>
                  <span>{receipts[0].tax}</span>
                </div>

                <div className="flex justify-between py-1 border-b mb-2 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(receipts[0].totalPrice)}</span>
                </div>

                <div className="text-center my-4 flex items-center justify-center flex-col">
                  <Image
                    className="mx-auto mb-2"
                    src={qrCodeData || ""}
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
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
            >
              Close
            </Button>
            <Button
              onPress={() => printReceipt()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Print
            </Button>
            <Button
              onPress={() => downloadReceipt()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Image
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
