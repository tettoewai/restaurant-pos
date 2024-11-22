"use client";
import { setPaidWithQuantity } from "@/app/lib/backoffice/action";
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
} from "@nextui-org/react";
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
import { toast } from "react-toastify";
import ListTable from "./ListTable";
import PaidPrint from "./PaidPrint";
import { useReactToPrint } from "react-to-print";
import { config } from "@/config";
import { OrderData } from "@/general";

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
  const componentRef = useRef<HTMLDivElement>(null);

  const printReceipt = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Print Receipt",
  });
  const { paid, setPaid } = useContext(BackOfficeContext);
  const receiptCode = paid.length > 0 ? paid[0].receiptCode : undefined;

  useEffect(() => {
    // Close the dialog if paid.length is less than 1
    if (paid.length < 1 && isOpen) {
      onClose();
    }
  }, [paid, isOpen, onClose]);
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
      menu: validMenu?.name,
      addon: addonCatAddon?.length ? addonCatAddon.join(", ") : "--",
      quantity: item.quantity,
      action: (
        <Button
          isIconOnly
          variant="light"
          onClick={() =>
            setPaid(paid.filter((paid) => paid.itemId !== item.itemId))
          }
        >
          <RxCross2 className="size-5 text-primary" />
        </Button>
      ),
    };
  });

  const [taxRate, setTaxRate] = useState(5);

  const subTotal = paid.reduce((accu, curr) => {
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

  useEffect(() => {
    const updatedPaid = paid.map((item) => {
      return { ...item, tax, totalPrice: total, qrCode: receiptUrl, tableId };
    });
    setPaid(updatedPaid);
  }, [tax, total, tableId, receiptUrl]);

  const [qrCodeImage, setQrCodeImage] = useState<string | null | undefined>("");

  const [isLoading, setIsLoading] = useState(false);

  const handlePaidAndPrint = async () => {
    setIsLoading(true);
    const { isSuccess, message, qrCodeImageDb } = await setPaidWithQuantity(
      paid
    );
    if (isSuccess) {
      setIsLoading(false);
      toast.success(message);

      if (qrCodeImageDb) {
        await new Promise<void>((resolve) => {
          setQrCodeImage(qrCodeImageDb[0]);
          resolve(); // Resolve the promise after setting the QR code image
        });
      }

      printReceipt();
      setPaid([]);
      setQrCodeImage("");
      onClose();
    } else {
      setIsLoading(false);
      toast.error(message);
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
                    qrCodeImage={qrCodeImage}
                  />
                ) : null}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onClick={onClose}
              isDisabled={isLoading}
            >
              Close
            </Button>
            <Button
              onClick={() => handlePaidAndPrint()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              isDisabled={isLoading}
            >
              {isLoading ? <Spinner color="white" /> : "Confirm and Print"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
