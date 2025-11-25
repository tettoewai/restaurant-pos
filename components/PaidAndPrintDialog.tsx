"use client";
import {
  generateQRCode,
  setPaidWithQuantity,
} from "@/app/lib/backoffice/action";
import { fetchCompany } from "@/app/lib/backoffice/data";
import {
  fetchPromotionMenuWithPromotionIds,
  fetchPromotionUsage,
  fetchPromotionWithTableId,
} from "@/app/lib/order/data";
import { config } from "@/config";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { PaidData } from "@/general";
import {
  addToast,
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
} from "@heroui/react";
import { AddonCategory, DiscountType, Promotion } from "@prisma/client";
import { calculateApplicablePromotions, formatCurrency } from "@/function";
import { CloseCircle, VerifiedCheck } from "@solar-icons/react/ssr";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import ImagePrintPaidReceipt from "./ImagePrintPaidReceipt";
import ListTable from "./ListTable";
import PaidPrint from "./PaidPrint";

interface Props {
  addonCategory: AddonCategory[] | undefined;
  tableId: number;
}

export default function PaidAndPrintDialog({ addonCategory, tableId }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: printImageIsOpen,
    onOpen: printImageOnOpen,
    onOpenChange: printImageOnOpenChange,
    onClose: printImageOnClose,
  } = useDisclosure();
  const componentRef = useRef<HTMLDivElement>(null);

  // const printReceipt = useReactToPrint({
  //   content: () => componentRef.current,
  //   documentTitle: "Print Receipt",
  // });
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
    const addonCatAddon = item.addons?.map((addon) => {
      const validAddonCat = addonCategory?.find(
        (addonCat) => addonCat.id === addon.addonCategoryId
      );

      return validAddonCat?.name + " : " + addon.name;
    });
    return {
      key: index + 1,
      menu: item.isFoc ? `${item.menu?.name} (FOC)` : item.menu?.name,
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
          <CloseCircle className="size-5 text-primary" />
        </Button>
      ),
    };
  });

  const { data: companyData } = useSWR("company-tax-rate", () => fetchCompany());
  const taxRate = companyData?.company?.taxRate ?? 0;

  const { data: promotions } = useSWR(
    paid.length ? ["bo-promotions", tableId] : null,
    () => fetchPromotionWithTableId(tableId)
  );
  const promotionIds = promotions?.map((item) => item.id) ?? [];
  const promotionMenuKey =
    promotionIds.length > 0
      ? ["bo-promotion-menus", promotionIds.join("-")]
      : null;
  const { data: promotionMenus } = useSWR(promotionMenuKey, () =>
    fetchPromotionMenuWithPromotionIds(promotionIds)
  );
  const currentOrderSeq = paid[0]?.orderSeq || "";
  const { data: promotionUsage } = useSWR(
    currentOrderSeq
      ? ["bo-promotion-usage", tableId, currentOrderSeq]
      : null,
    () =>
      currentOrderSeq
        ? fetchPromotionUsage({ tableId, orderSeq: currentOrderSeq })
        : Promise.resolve([])
  );

  const calculateLineTotal = (item: PaidData) => {
    if (item.isFoc || !item.menu || !item.quantity) return 0;
    const addonTotal =
      item.addons?.reduce((acc, addon) => acc + addon.price, 0) ?? 0;
    return (item.menu.price + addonTotal) * item.quantity;
  };

  const subTotal = useMemo(
    () =>
      paid
        .filter((item) => !item.isFoc)
        .reduce((acc, curr) => acc + calculateLineTotal(curr), 0),
    [paid]
  );

  const menuOrderData = useMemo(() => {
    return paid.reduce(
      (acc, item) => {
        if (!item.menu?.id || !item.quantity || item.isFoc) {
          return acc;
        }
        const existing = acc[item.menu.id] || {
          menuId: item.menu.id,
          quantity: 0,
        };
        existing.quantity += item.quantity;
        acc[item.menu.id] = existing;
        return acc;
      },
      {} as Record<number, { menuId: number; quantity: number }>
    );
  }, [paid]);

  const applicablePromotions = useMemo(() => {
    if (!promotions?.length) return [];
    const promoList =
      calculateApplicablePromotions({
        promotions,
        promotionMenus,
        menuOrderData,
        totalPrice: subTotal,
        promotionUsage,
      }) || [];
    const grouped = promoList.reduce<Record<string, Promotion>>(
      (acc, promo) => {
        const key = promo.group?.toLowerCase() || promo.name;
        if (!acc[key]) {
          acc[key] = promo;
        }
        return acc;
      },
      {}
    );
    return Object.values(grouped);
  }, [promotions, promotionMenus, menuOrderData, subTotal, promotionUsage]);

  const discountPromotions = useMemo(
    () =>
      applicablePromotions.filter(
        (promo) =>
          promo.discount_type !== DiscountType.FOCMENU && promo.discount_value
      ),
    [applicablePromotions]
  );

  const discountAmount = useMemo(() => {
    if (!discountPromotions.length || !subTotal) return 0;
    return discountPromotions.reduce((acc, promo) => {
      if (!promo.discount_value) return acc;
      if (promo.discount_type === DiscountType.FIXED_AMOUNT) {
        return acc + promo.discount_value;
      }
      if (promo.discount_type === DiscountType.PERCENTAGE) {
        return acc + Math.floor((subTotal * promo.discount_value) / 100);
      }
      return acc;
    }, 0);
  }, [discountPromotions, subTotal]);

  const appliedDiscount = Math.min(discountAmount, subTotal);
  const promotionIdsToLog = Array.from(
    new Set(discountPromotions.map((promo) => promo.id))
  );

  const netSubTotal = Math.max(subTotal - appliedDiscount, 0);
  const taxAmount = Number(((netSubTotal * taxRate) / 100).toFixed(2));
  const total = Number((netSubTotal + taxAmount).toFixed(2));

  const receiptUrl = useMemo(
    () =>
      paid.length > 0
        ? `${config.digitalReceiptUrl}/${paid[0].receiptCode}`
        : "",
    [paid]
  );

  const { data: qrCodeData, isLoading: qrCodeIsLoading } = useSWR(
    receiptUrl ? `qrCodeData -${receiptUrl}` : null,
    () => generateQRCode(receiptUrl)
  );

  // Use ref to store latest paid value to avoid stale closures
  const paidRef = useRef(paid);
  useEffect(() => {
    paidRef.current = paid;
  }, [paid]);

  useEffect(() => {
    if (paid.length === 0) return;

    setPaid((currentPaid) =>
      currentPaid.map((item) => ({
        ...item,
        tax: taxAmount,
        totalPrice: total,
        qrCode: receiptUrl,
        tableId,
        subTotal: calculateLineTotal(item),
      }))
    );
  }, [taxAmount, total, receiptUrl, tableId, setPaid, paid.length]);

  const [isLoading, setIsLoading] = useState(false);

  const handlePaidAndPrint = async () => {
    setIsLoading(true);
    // Use ref to get the latest paid value to avoid stale closures
    const currentPaid = paidRef.current;
    const { isSuccess, message } = await setPaidWithQuantity(currentPaid, {
      discountAmount: appliedDiscount,
      promotionIds: promotionIdsToLog,
    });
    setIsLoading(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
    if (isSuccess) {
      printImageOnOpen();
    }
  };

  const handleCloseDialog = (e?: any) => {
    e?.preventDefault();
    onClose();
    console.log("Paid Dialog is closed.");
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
            <VerifiedCheck color="white" className="size-5" />
          </Button>
        </Tooltip>
      </Badge>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDialog();
          }
        }}
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
                {paid.length ? (
                  <div className="flex flex-col items-end pr-2 mt-3 text-sm space-y-1">
                    <span>
                      Sub total: {formatCurrency(subTotal || 0)}
                    </span>
                    {appliedDiscount ? (
                      <span>
                        Discount: -{formatCurrency(appliedDiscount)}
                      </span>
                    ) : null}
                    <span>
                      Net total:{" "}
                      {formatCurrency(
                        Math.max(subTotal - appliedDiscount, 0)
                      )}
                    </span>
                    <span>
                      Tax ({taxRate}%): {formatCurrency(taxAmount)}
                    </span>
                    <span className="font-semibold">
                      Grand total: {formatCurrency(total)}
                    </span>
                  </div>
                ) : null}
              </div>
              {qrCodeIsLoading ? (
                <Spinner variant="wave" label="Qr Loading ..." />
              ) : (
                <div className="w-fit max-w-fit md:w-[320px] h-[450px] overflow-x-scroll border-2 border-gray-500 rounded-lg border-dashed scrollbar-hide">
                  {isOpen ? (
                    <PaidPrint
                      tableId={tableId}
                      receiptCode={receiptCode}
                      componentRef={componentRef}
                      discount={appliedDiscount}
                      taxRate={taxRate}
                      taxAmount={taxAmount}
                      subTotal={subTotal}
                      total={total}
                      qrCodeImage={qrCodeData}
                      paid={paid}
                    />
                  ) : null}
                </div>
              )}
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
              isDisabled={isLoading || qrCodeIsLoading}
            >
              {isLoading || qrCodeIsLoading ? (
                <Spinner color="white" variant="wave" />
              ) : (
                "Confirm"
              )}
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
        discount={appliedDiscount}
        taxRate={taxRate}
        taxAmount={taxAmount}
        subTotal={subTotal}
        total={total}
        qrCodeImage={qrCodeData}
      />
    </div>
  );
}
