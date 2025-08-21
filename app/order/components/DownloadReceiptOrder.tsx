"use client";

import { generateQRCode } from "@/app/lib/backoffice/action";
import {
  fetchAddonWithIds,
  fetchCompany,
  fetchMenuWithIds,
  fetchSelectedLocationData,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import { setKnownReceipt } from "@/app/lib/order/action";
import {
  fetchLastPaidOrder,
  fetchReceiptWithItemId,
} from "@/app/lib/order/data";
import { config } from "@/config";
import { dateToString, formatCurrency } from "@/function";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  cn,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Receipt } from "@prisma/client";
import html2canvas from "html2canvas";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

export const CustomRadio = (props: any) => {
  const { children, ...otherProps } = props;

  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 bg-conten2 hover:bg-content3 items-center justify-between",
          "flex-row-reverse  max-w-[300px] cursor-pointer rounded-lg gap-4 p-2 border-1",
          "data-[selected=true]:border-primary"
        ),
      }}
    >
      {children}
    </Radio>
  );
};

export default function DownloadReceiptOrder() {
  const searchParams = useSearchParams();
  const tableId = Number(searchParams.get("tableId"));

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { data: lastPaidOrder, isLoading: lastPaidReceiptIsLoading } = useSWR(
    tableId ? ["lastPaidOrder", tableId] : null,
    () => fetchLastPaidOrder(tableId),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const componentRef = useRef<HTMLDivElement>(null);

  const itemIds =
    lastPaidOrder && lastPaidOrder.length
      ? lastPaidOrder.map((item) => item.itemId)
      : [];

  const { data: receipts, isLoading: receiptIsLoading } = useSWR(
    lastPaidOrder && lastPaidOrder.length ? ["receipts", itemIds] : null,
    () => fetchReceiptWithItemId({ itemIds })
  );

  const receiptData: { code: string; receipts: Receipt[] }[] = useMemo(() => {
    return receipts && receipts.length
      ? Object.values(
          receipts.reduce((acc: any, cur: any) => {
            if (!acc[cur.code]) {
              acc[cur.code] = { code: cur.code, receipts: [] };
            }
            acc[cur.code].receipts.push(cur);
            return acc;
          }, {})
        )
      : [];
  }, [receipts]);

  const isPaid = useMemo(() => {
    return Boolean(receiptData && receiptData.length);
  }, [receiptData]);

  const { data: company, isLoading: companyIsLoading } = useSWR("company", () =>
    fetchCompany()
  );
  const { data: table, isLoading: tableIsLoading } = useSWR(
    tableId ? ["table", tableId] : null,
    () => fetchTableWithId(tableId)
  );

  const menuIds =
    receipts && receipts.length ? receipts.map((item) => item.menuId) : [];

  const { data: menuData, isLoading: menuIsLoading } = useSWR(
    menuIds && menuIds.length ? ["menuData", menuIds] : null,
    () => fetchMenuWithIds(menuIds)
  );

  const addonIds =
    receipts && receipts.length
      ? receipts.map((item) => item.addonId).filter((item) => item !== null)
      : [];

  const { data: addonData } = useSWR(
    menuIds && menuIds.length ? ["addonData", addonIds] : null,
    () => fetchAddonWithIds(addonIds)
  );

  const receiptUrl = useMemo(() => {
    if (isOpen && receiptData) {
      return receiptData.length > 0 && isOpen
        ? `${config.digitalReceiptUrl}/${receiptData[0].code}`
        : "";
    } else {
      return "";
    }
  }, [isOpen, receiptData]);

  const { data: qrCodeData, isLoading: qrCodeLoading } = useSWR(
    receiptUrl && isOpen ? `qrCodeData -${receiptUrl}` : null,
    () =>
      receiptUrl && isOpen ? generateQRCode(receiptUrl) : Promise.resolve("")
  );

  const { data: location } = useSWR(isOpen ? "location" : null, () =>
    fetchSelectedLocationData()
  );

  const [selectedReceipt, setSelectedReceipt] = useState("");

  useEffect(() => {
    if (isPaid) {
      onOpen();
    }
  }, [isPaid, onOpen]);

  const downloadReceipt = async () => {
    if (
      !componentRef.current ||
      !validReceiptData ||
      !validReceiptData.receipts.length
    )
      return;

    const canvas = await html2canvas(componentRef.current, {
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.scrollHeight,
    });

    const image = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    link.href = image;
    link.download = `${receiptData[0].code} Receipt ${dateToString({
      date: validReceiptData.receipts[0].date,
      type: "DMY",
    })}`;
    link.click();
  };

  const validReceiptData = selectedReceipt
    ? receiptData.find((item) => item.code === selectedReceipt)
    : receiptData[0];

  if (!validReceiptData || !validReceiptData.receipts.length) return null;

  const subTotal =
    validReceiptData && validReceiptData.receipts.length
      ? validReceiptData.receipts
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
          }, 0)
      : 0;

  const handleCloseDialog = (e?: any) => {
    e?.preventDefault();
    setKnownReceipt(validReceiptData.code);
    onClose();
  };

  return (
    <div>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDialog();
          }
        }}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col text-center">
            Print Receipt
          </ModalHeader>
          <ModalBody className="flex justify-center items-center h-full">
            {receiptData && receiptData.length > 1 ? (
              <div className="w-full">
                <Accordion>
                  <AccordionItem key="1" aria-label="Receipts" title="Receipts">
                    <RadioGroup
                      value={selectedReceipt || receiptData[0].code}
                      onValueChange={setSelectedReceipt}
                    >
                      {receiptData.map((item) => (
                        <CustomRadio key={item.code} value={item.code}>
                          {item.code}
                        </CustomRadio>
                      ))}
                    </RadioGroup>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : null}
            {lastPaidReceiptIsLoading &&
            receiptIsLoading &&
            qrCodeLoading &&
            menuIsLoading ? (
              <Spinner size="sm" />
            ) : (
              <div className="w-full pt-44 flex justify-center items-center rounded-md">
                <Card
                  ref={componentRef}
                  shadow="none"
                  radius="none"
                  className="w-[320px] p-2 pb-1 bg-white text-sm font-mono text-black border-none"
                >
                  <div>#{validReceiptData.code}</div>
                  <div className="text-center border-b pb-4 mb-4">
                    <h2 className="font-bold text-lg">
                      {company?.company?.name}
                    </h2>
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
                    <span>{table?.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Date:</span>
                    <span>
                      {dateToString({
                        date: validReceiptData.receipts[0].date,
                        type: "DMY",
                      })}
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
                      {validReceiptData.receipts.map((item: Receipt, index) => {
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
                    <span>{formatCurrency(subTotal)}</span>
                  </div>

                  {/* Tax rate input controlled by user */}
                  <div className="flex justify-between py-1 border-b mb-2">
                    <span className="flex items-center">Tax :</span>
                    <span>
                      {formatCurrency(validReceiptData.receipts[0].tax)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b mb-2 font-bold">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(validReceiptData.receipts[0].totalPrice)}
                    </span>
                  </div>

                  <div className="text-center my-4 flex items-center justify-center flex-col">
                    {qrCodeData ? (
                      <Image
                        className="mx-auto mb-2"
                        src={qrCodeData || ""}
                        alt="QR Code"
                        width={100}
                        height={100}
                      />
                    ) : null}
                    <p className="text-xs text-gray-500">
                      Scan for digital receipt or feedback
                    </p>
                  </div>

                  <div className="text-center text-gray-600 text-xs">
                    <p>Thank you for your purchase!</p>
                    <p>Please come again.</p>
                  </div>
                </Card>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={() => handleCloseDialog()}
            >
              Dismiss
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
    </div>
  );
}
