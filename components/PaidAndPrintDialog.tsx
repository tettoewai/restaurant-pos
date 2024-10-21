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
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { Addon, AddonCategory, Menu } from "@prisma/client";
import { useContext, useEffect, useRef } from "react";
import { PiHandCoinsFill } from "react-icons/pi";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import ListTable from "./ListTable";
import PaidPrint from "./PaidPrint";
import { useReactToPrint } from "react-to-print";

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
    const addonIds: number[] = JSON.parse(item.addons);
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

  const handlePaidAndPrint = async () => {
    const { isSuccess, message } = await setPaidWithQuantity(paid);
    if (isSuccess) {
      toast.success(message);
      printReceipt();
      setPaid([]);
      onClose();
    } else {
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
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background overflow-y-scroll"
        placement="center"
        size="full"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col">Paid and Print</ModalHeader>
          <ModalBody>
            <div className="flex w-full h-full flex-wrap justify-center">
              <div className="w-full md:w-2/3">
                <ListTable columns={columns} rows={rows} />
              </div>
              <div className="w-fit max-w-fit md:w-1/3 h-[450px] overflow-x-scroll border-2 border-gray-500 rounded-lg border-dashed scrollbar-hide">
                {isOpen ? (
                  <PaidPrint
                    tableId={tableId}
                    menus={menus}
                    addons={addons}
                    componentRef={componentRef}
                  />
                ) : null}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              onClick={() => handlePaidAndPrint()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Confirm and Print
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
