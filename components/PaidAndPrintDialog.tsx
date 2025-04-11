"use client";
import {
  generateQRCode,
  setPaidWithQuantity,
} from "@/app/lib/backoffice/action";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tooltip,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { Addon, AddonCategory, Menu } from "@prisma/client";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PiHandCoinsFill } from "react-icons/pi";
import { RxCross2 } from "react-icons/rx";
import ListTable from "./ListTable";
import PaidPrint from "./PaidPrint";
import { useReactToPrint } from "react-to-print";
import { config } from "@/config";
import { OrderData } from "@/general";
import useSWR from "swr";
import ImagePrintPaidReceipt from "./ImagePrintPaidReceipt";

interface Props {
  menus: Menu[] | undefined;
  addons: Addon[] | undefined;
  addonCategory: AddonCategory[] | undefined;
  tableId: number;
}

export default function PaidAndPrintDialog({
  menus,
  addons,
  addonCategory,
  tableId,
}: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: printImageIsOpen,
    onOpen: printImageOnOpen,
    onOpenChange: printImageOnOpenChange,
    onClose: printImageOnClose,
  } = useDisclosure();
  const componentRef = useRef<HTMLDivElement>(null);

  const printReceipt = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Print Receipt",
  });
  const { paid, setPaid } = useContext(BackOfficeContext);
  const receiptCode = paid.length > 0 ? paid[0].receiptCode : undefined;

  // useEffect(() => {
  //   // Close the dialog if paid.length is less than 1
  //   if (paid.length < 1 && isOpen) {
  //     onClose();
  //   }
  // }, [paid, isOpen, onClose]);

  const columns = [
    {
      key: "key",
      label: "No.",
    },
    {
      key: "menu",
      label: "Menu",
    },
    { key: "addon", label: "Addon" },
    { key: "quantity", label: "Quantity" },
    { key: "action", label: "Action" },
  ];

  const rows = paid.map((item, index) => {
    const validMenu = menus?.find((menu) => item.menuId === menu.id);
    const addonIds: number[] = item.addons ? JSON.parse(item.addons) : [];
    const validAddon = addons?.filter((addon) => addonIds.includes(addon.id));
    const addonCatAddon = validAddon?.map((addon) => {
      const validAddonCat = addonCategory?.find(
        (addonCat) => addonCat.id === addon.addonCategoryId
      );

      return validAddonCat?.name + " : " + addon.name;
    });
    return {
      key: index + 1,
      menu: item.isFoc ? `${validMenu?.name} (FOC)` : validMenu?.name,
      addon: addonCatAddon?.length ? addonCatAddon.join(", ") : "--",
      quantity: item.quantity,
      action: (
        <Button
          isIconOnly
          variant="light"
          onPress={() =>
            setPaid(paid.filter((paid) => paid.itemId !== item.itemId))
          }
        >
          <RxCross2 className="size-5 text-primary" />
        </Button>
      ),
    };
  });

  const [taxRate, setTaxRate] = useState(5);

  const subTotal = paid
    .filter((item) => !item.isFoc)
    .reduce((accu, curr) => {
      const validMenu = menus?.find((item) => item.id === curr.menuId);
      const paidAddons: number[] = curr.addons ? JSON.parse(curr.addons) : [];
      const paidAddonPrices = addons
        ?.filter((item) => paidAddons.includes(item.id))
        .reduce((accu, curr) => curr.price + accu, 0);
      if (!curr.quantity) return 0;
      const totalPrice =
        paidAddonPrices && validMenu
          ? (validMenu.price + paidAddonPrices) * curr.quantity + accu
          : validMenu
          ? validMenu.price * curr.quantity + accu
          : 0;
      return totalPrice;
    }, 0);

  // Tax and total calculations based on user input
  const tax = subTotal * (taxRate / 100);
  const total = subTotal + tax;

  const receiptUrl = useMemo(
    () =>
      paid.length > 0
        ? `${config.digitalReceiptUrl}/${paid[0].receiptCode}`
        : "",
    [paid]
  );

  const { data: qrCodeData } = useSWR(
    receiptUrl ? `qrCodeData -${receiptUrl}` : null,
    () => generateQRCode(receiptUrl)
  );

  useEffect(() => {
    const updatedPaid = paid.map((item) => {
      const validMenu = menus?.find((menu) => menu.id === item.menuId);
      const paidAddons: number[] = item.addons ? JSON.parse(item.addons) : [];
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

      return {
        ...item,
        tax,
        totalPrice: total,
        qrCode: receiptUrl,
        tableId,
        subTotal: currentTotalPrice,
      };
    });
    setPaid(updatedPaid);
  }, [tax, total, receiptUrl]);

  const [isLoading, setIsLoading] = useState(false);

  const handlePaidAndPrint = async () => {
    setIsLoading(true);
    const { isSuccess, message } = await setPaidWithQuantity(paid);
    setIsLoading(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      printImageOnOpen();
    }
  };
  return (
    <div className="relative">
      <Badge
        content={paid.length}
        color="primary"
        placement="top-right"
        isInvisible={paid.length === 0}
        className="text-white"
      >
        <Tooltip
          placement="bottom-end"
          content="Paid"
          className="text-primary"
          showArrow={true}
          delay={1000}
        >
          <Button
            color="primary"
            isIconOnly
            className="flex"
            onPress={onOpen}
            isDisabled={paid.length === 0}
          >
            <PiHandCoinsFill color="white" className="size-5" />
          </Button>
        </Tooltip>
      </Badge>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        className="bg-background overflow-y-scroll"
        placement="center"
        size="full"
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col text-center">
            Paid and Print (if you refresh page, paid list will empty)
          </ModalHeader>
          <ModalBody>
            <div className="flex w-full h-full flex-wrap justify-center">
              <div className="w-full md:w-2/3">
                <ListTable columns={columns} rows={rows} />
              </div>
              <div className="w-fit max-w-fit md:w-[320px] h-[450px] overflow-x-scroll border-2 border-gray-500 rounded-lg border-dashed scrollbar-hide">
                {isOpen ? (
                  <PaidPrint
                    tableId={tableId}
                    receiptCode={receiptCode}
                    menus={menus}
                    addons={addons}
                    componentRef={componentRef}
                    setTaxRate={setTaxRate}
                    taxRate={taxRate}
                    subTotal={subTotal}
                    qrCodeImage={qrCodeData}
                    paid={paid}
                  />
                ) : null}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
              isDisabled={isLoading}
            >
              Close
            </Button>
            <Button
              onPress={() => handlePaidAndPrint()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              isDisabled={isLoading}
            >
              {isLoading ? <Spinner color="white" /> : "Confirm"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ImagePrintPaidReceipt
        isOpen={printImageIsOpen}
        onOpenChange={printImageOnOpenChange}
        receiptCode={receiptCode}
        componentRef={componentRef}
        onClose={printImageOnClose}
        onPaidClose={onClose}
        tableId={tableId}
        menus={menus}
        addons={addons}
        setTaxRate={setTaxRate}
        taxRate={taxRate}
        subTotal={subTotal}
        qrCodeImage={qrCodeData}
      />
    </div>
  );
}
