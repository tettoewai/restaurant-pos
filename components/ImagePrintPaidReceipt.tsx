"use client";

import { BackOfficeContext } from "@/context/BackOfficeContext";
import { dateToString } from "@/function";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import html2canvas from "html2canvas";
import { Dispatch, RefObject, SetStateAction, useContext } from "react";
import { useReactToPrint } from "react-to-print";
import PaidPrint from "./PaidPrint";

interface Props {
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  onPaidClose: () => void;
  receiptCode?: string;
  componentRef: RefObject<HTMLDivElement>;
  tableId: number;
  subTotal: number;
  taxRate: number;
  setTaxRate: Dispatch<SetStateAction<number>>;
  qrCodeImage: string | null | undefined;
}

export default function ImagePrintPaidReceipt({
  isOpen,
  onOpenChange,
  onClose,
  receiptCode,
  componentRef,
  tableId,
  subTotal,
  taxRate,
  setTaxRate,
  qrCodeImage,
  onPaidClose,
}: Props) {
  const { paid, setPaid } = useContext(BackOfficeContext);

  const printReceipt = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Print Receipt",
  });

  const date = new Date();

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
    link.download = `${receiptCode} Receipt ${dateToString({
      date: date,
      type: "DMY",
    })}`;
    link.click();
  };

  const handleCloseDialog = (e?: any) => {
    e?.preventDefault();
    onClose();
    onPaidClose();
    setPaid([]);
  };

  return (
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
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Save Receipt</ModalHeader>
        <ModalBody>
          <h1>Order is paid successfully.</h1>
          <div className="w-full flex justify-center items-center">
            <PaidPrint
              tableId={tableId}
              receiptCode={receiptCode}
              componentRef={componentRef}
              setTaxRate={setTaxRate}
              taxRate={taxRate}
              subTotal={subTotal}
              qrCodeImage={qrCodeImage}
              paid={paid}
              isPrint
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onPress={() => downloadReceipt()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Image
          </Button>
          <Button
            className="px-10 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            onPress={() => printReceipt()}
          >
            Print
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
