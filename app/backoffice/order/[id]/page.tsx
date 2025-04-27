"use client";
import {
  setNotiReadWithTableId,
  updateOrderStatus,
} from "@/app/lib/backoffice/action";
import {
  checkTableLocation,
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchOrderWithTableId,
} from "@/app/lib/backoffice/data";
import CancelOrderBODialog from "@/components/CancelOrderBODialog";
import PaidAndPrintDialog from "@/components/PaidAndPrintDialog";
import QuantityDialog from "@/components/QuantityDialog";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { formatCurrency } from "@/function";
import { formatOrder, getTotalOrderPrice, OrderData } from "@/general";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Spinner, useDisclosure } from "@heroui/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Tab, Tabs } from "@heroui/tabs";
import { addToast } from "@heroui/toast";
import { User } from "@heroui/user";
import { ORDERSTATUS } from "@prisma/client";
import clsx from "clsx";
import { nanoid } from "nanoid";
import { useContext, useEffect, useMemo, useState } from "react";
import { IoIosArrowDropdown } from "react-icons/io";
import useSWR, { mutate } from "swr";
export default function App({ params }: { params: { id: string } }) {
  const tabs = useMemo(() => ["pending", "cooking", "complete"], []);

  const tableId = Number(params.id);

  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);

  useEffect(() => {
    if (tableId) {
      setNotiReadWithTableId(tableId);
    }
  }, [tableId, tabs]);

  useEffect(() => {
    if (tableId) {
      mutate([tableId, isUpdateLocation, params]);
    }
  }, [tableId, isUpdateLocation, params]);

  const { data: table, isLoading: tableIsLoading } = useSWR(
    tableId ? [tableId, isUpdateLocation, params] : null,
    () => checkTableLocation(tableId).then((res) => res)
  );

  const {
    data,
    error,
    isLoading: orderIsLoading,
  } = useSWR(
    table && table.id ? [table.id, isUpdateLocation] : null,
    () => fetchOrderWithTableId(tableId).then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const [selected, setSelected] = useState("pending");

  const [itemId, setItemId] = useState<string>();

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const {
    isOpen: cancelIsOpen,
    onOpen: cancelOnOpen,
    onOpenChange: cancelOnOpenChange,
    onClose: cancelOnClose,
  } = useDisclosure();

  const menuIds = data?.map((item) => item.menuId) as number[];
  const { data: menus, isLoading: menuIsLoading } = useSWR(
    menuIds && menuIds.length > 0 ? [menuIds] : null,
    () => fetchMenuWithIds(menuIds).then((res) => res)
  );
  const addonIds = data
    ? data.map((item) => item.addonId).filter((addon) => addon !== null)
    : [];
  const { data: addons, isLoading: addonIsLoading } = useSWR(
    addonIds && addonIds?.length > 0 ? [addonIds] : null,
    () => fetchAddonWithIds(addonIds).then((res) => res)
  );

  const addonCatIds =
    addons && addons.length > 0
      ? addons.map((item) => item.addonCategoryId)
      : [];

  const { data: addonCategory, isLoading: addonCategoryIsLoading } = useSWR(
    addonCatIds && addonCatIds.length > 0 ? [addons] : null,
    () => fetchAddonCategoryWithIds(addonCatIds).then((res) => res)
  );

  const orderData = useMemo(
    () => (data && menus ? formatOrder({ orders: data, menus, addons }) : []),
    [addons, data, menus]
  );

  const [statusChanging, setStatusChanging] = useState([
    { id: "", isLoading: false },
  ]);

  const { paid, setPaid } = useContext(BackOfficeContext);

  const receiptCode = useMemo(
    () =>
      paid && paid.length > 0 && paid[0].receiptCode
        ? paid[0].receiptCode
        : nanoid(6),
    [paid]
  );

  const date = new Date();

  const [quantityDialogData, setQuantityDialogData] = useState<OrderData>({
    itemId: "",
    addons: [],
    menu: undefined,
    quantity: 0,
    status: "COMPLETE",
    totalPrice: 0,
    instruction: "",
  });

  const [prevQuantity, setPrevQuantity] = useState<number>(0);

  let unpaidOrderData = useMemo(() => {
    if (!orderData) return [];
    return orderData
      .map((order) => {
        const paidOrder = paid.find(
          (paidOrder) => paidOrder.itemId === order.itemId
        );

        // Calculate the remaining quantity by subtracting the paid quantity from the original order quantity
        const remainingQuantity =
          paidOrder && order.quantity && paidOrder.quantity
            ? order.quantity - paidOrder.quantity
            : order.quantity || 0;

        // Return the updated order with the remaining quantity if it's greater than 0
        if (remainingQuantity > 0) {
          return { ...order, quantity: remainingQuantity };
        }
        return null;
      })
      .filter((order) => order !== null)
      .filter((item) => Number(item.quantity) > 0);
  }, [paid, orderData]);

  const handleStatusChange = async (status: string, id: string) => {
    if (status === "cancel") return cancelOnOpen();
    setStatusChanging((prev) => {
      return prev.some((item) => item.id === id)
        ? prev.map((item) => (item.id === id ? { id, isLoading: true } : item))
        : [...prev, { id, isLoading: true }];
    });
    const { message, isSuccess } = await updateOrderStatus({
      orderStatus: status,
      itemId: id,
    });

    if (isSuccess) {
      addToast({ title: message, color: "success" });
      mutate([tableId, isUpdateLocation]);
    } else {
      addToast({ title: message, color: "danger" });
    }
    setStatusChanging((prev) =>
      prev.map((item) => (item.id === id ? { id, isLoading: false } : item))
    );
  };

  const addToPaid = (item: OrderData, isDialog?: boolean) => {
    if (isDialog && item.quantity && item.quantity > 1) {
      const validUnpaid = unpaidOrderData.find(
        (item) => item.itemId === item.itemId
      );
      if (!item.quantity || !validUnpaid) return;
      const updatedItem = {
        ...validUnpaid,
        quantity: prevQuantity - item.quantity,
      };
      const updatedUnpaidOrderData = unpaidOrderData.map((order) =>
        order.itemId === item.itemId ? updatedItem : order
      );
      unpaidOrderData = updatedUnpaidOrderData;

      setPaid((prev) => [
        ...prev,
        {
          ...item,
          quantity: item.quantity,
          receiptCode,
          date,
          tableId,
        },
      ]);
      return;
    }
    const validPaidItem = paid.find((paid) => paid.itemId === item.itemId);
    const otherPaidItem = paid.filter((other) => other.itemId !== item.itemId);
    if (validPaidItem && validPaidItem.quantity && item.quantity) {
      const updatePaid = {
        ...validPaidItem,
        quantity: validPaidItem.quantity + item.quantity,
        receiptCode,
      };
      setPaid([...otherPaidItem, updatePaid]);
      return;
    }
    setPaid((prev) => [
      ...prev,
      {
        ...item,
        quantity: item.quantity,
        receiptCode,
        date,
        tableId,
      },
    ]);
  };

  const addAllPaid = (items: OrderData[]) => {
    items.map((item) => {
      setPaid((prev) => [
        ...prev,
        {
          ...item,
          quantity: item.quantity,
          receiptCode,
          date,
          tableId,
        },
      ]);
    });
  };

  const totalUnpidPrice = getTotalOrderPrice({
    orders: unpaidOrderData.filter((item) => !item.isFoc),
  });

  const completedOrder = unpaidOrderData.filter(
    (item) => item.status === "COMPLETE"
  );

  if (
    tableIsLoading ||
    orderIsLoading ||
    menuIsLoading ||
    addonIsLoading ||
    addonCategoryIsLoading
  )
    return (
      <div className="w-full h-72 flex justify-center items-center">
        <Spinner
          variant="wave"
          label={`${
            tableIsLoading
              ? "Table"
              : orderIsLoading
              ? "Order"
              : menuIsLoading
              ? "Menu"
              : addonIsLoading
              ? "Addon"
              : addonCategoryIsLoading
              ? "Adddon Category"
              : ""
          } is loading ...`}
        />
      </div>
    );
  if (!table) return <span>There is no table ordered!</span>;

  return (
    <div className="flex w-full flex-col relative">
      {table ? (
        <span className="flex md:absolute top-5 left-3">
          Order of {table?.name},{" "}
          {unpaidOrderData.length &&
            totalUnpidPrice &&
            "Total price : " + formatCurrency(totalUnpidPrice)}
        </span>
      ) : null}
      <div className="absolute mt-1.5 top-8 right-2.5 md:top-1 md:right-2">
        <PaidAndPrintDialog addonCategory={addonCategory} tableId={tableId} />
      </div>
      <Tabs
        aria-label="Options"
        color="primary"
        variant="bordered"
        selectedKey={selected}
        onSelectionChange={(e: any) => setSelected(e.toLocaleString())}
        className="flex justify-center md:justify-end mr-9 md:mr-14 mt-2.5 relative"
      >
        {tabs.map((item) => {
          const filteredUnpaidOrders = unpaidOrderData.filter(
            (order) => order.status && order.status.toLowerCase() === item
          );
          return (
            <Tab
              key={item}
              title={
                <Badge
                  content={filteredUnpaidOrders.length}
                  isInvisible={filteredUnpaidOrders.length === 0}
                  color="primary"
                  className="text-white absolute top-0 -right-2"
                  placement="top-right"
                >
                  <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                </Badge>
              }
            >
              <div className="p-1 w-full h-full overflow-auto">
                <div className="w-full flex justify-end">
                  {selected === "complete" &&
                  completedOrder &&
                  completedOrder.length > 0 ? (
                    <Button
                      color="primary"
                      className="mb-2"
                      onPress={() => addAllPaid(completedOrder)}
                    >
                      Paid all
                    </Button>
                  ) : null}
                </div>
                <Table
                  aria-label="Order list"
                  removeWrapper
                  className="bg-background rounded-lg p-1 md:w-full overflow-x-auto"
                  fullWidth
                >
                  <TableHeader>
                    <TableColumn>No.</TableColumn>
                    <TableColumn align="start">Menu</TableColumn>
                    <TableColumn>Addon</TableColumn>
                    <TableColumn>Quantity</TableColumn>
                    <TableColumn align="center">Status</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="There is no order yet">
                    {filteredUnpaidOrders.map((item, index) => {
                      const addonCatAddon = item.addons?.map((addon) => {
                        const validAddonCat = addonCategory?.find(
                          (addonCat) => addonCat.id === addon.addonCategoryId
                        );

                        return validAddonCat?.name + " : " + addon.name;
                      });
                      return (
                        <TableRow key={index + 1}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="min-w-52">
                            <User
                              avatarProps={{
                                radius: "sm",
                                src: item.menu?.assetUrl || "/default-menu.png",
                              }}
                              description={item.instruction}
                              name={
                                item.isFoc
                                  ? `${item.menu?.name} (FOC)`
                                  : item.menu?.name
                              }
                            >
                              {item.instruction}
                            </User>
                          </TableCell>
                          <TableCell align="left" className="min-w-40">
                            <span className="text-wrap">
                              {addonCatAddon?.length
                                ? addonCatAddon.join(", ")
                                : "--"}
                            </span>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Dropdown className="bg-background">
                              <DropdownTrigger>
                                <Button
                                  endContent={<IoIosArrowDropdown />}
                                  size="sm"
                                  isDisabled={
                                    statusChanging.find(
                                      (statusItem) =>
                                        statusItem.id === item.itemId
                                    )?.isLoading
                                  }
                                  variant="light"
                                  color={
                                    item.status === "PENDING"
                                      ? "primary"
                                      : item.status === "COOKING"
                                      ? "warning"
                                      : "success"
                                  }
                                >
                                  {statusChanging.find(
                                    (statusItem) =>
                                      statusItem.id === item.itemId
                                  )?.isLoading ? (
                                    <Spinner variant="wave" className="mb-4" />
                                  ) : (
                                    item.status &&
                                    item.status.charAt(0).toUpperCase() +
                                      item.status.slice(1)
                                  )}
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Status"
                                onAction={async (e: any) => {
                                  const status = String(e);
                                  setItemId(item.itemId);
                                  if (status === "paid") {
                                    if (item.status !== "COMPLETE") return;
                                    if (item.quantity && item.quantity > 1) {
                                      setPrevQuantity(item.quantity);
                                      setQuantityDialogData(item);
                                      onOpen();
                                      return;
                                    }
                                    addToPaid(item);
                                    return;
                                  }

                                  handleStatusChange(status, item.itemId);
                                }}
                              >
                                <DropdownItem
                                  key="pending"
                                  className={clsx({
                                    hidden: item.status === ORDERSTATUS.PENDING,
                                  })}
                                >
                                  Pending
                                </DropdownItem>
                                <DropdownItem
                                  key="cooking"
                                  className={clsx({
                                    hidden: item.status === ORDERSTATUS.COOKING,
                                  })}
                                >
                                  Cooking
                                </DropdownItem>
                                <DropdownItem
                                  key="complete"
                                  className={clsx({
                                    hidden:
                                      item.status === ORDERSTATUS.COMPLETE,
                                  })}
                                >
                                  Complete
                                </DropdownItem>
                                {selected === "pending" ? (
                                  <DropdownItem key="cancel">
                                    Cancel
                                  </DropdownItem>
                                ) : (
                                  <DropdownItem key="none" className="hidden">
                                    None
                                  </DropdownItem>
                                )}
                                {selected === "complete" ? (
                                  <DropdownItem key="paid">Paid</DropdownItem>
                                ) : (
                                  <DropdownItem key="none1" className="hidden">
                                    None
                                  </DropdownItem>
                                )}
                              </DropdownMenu>
                            </Dropdown>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Tab>
          );
        })}
      </Tabs>
      <QuantityDialog
        addToPaid={addToPaid}
        quantityDialogData={quantityDialogData}
        setQuantityDialogData={setQuantityDialogData}
        prevQuantity={prevQuantity}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
      />

      {itemId ? (
        <CancelOrderBODialog
          itemId={itemId}
          isOpen={cancelIsOpen}
          onOpen={cancelOnOpen}
          onClose={cancelOnClose}
          onOpenChange={cancelOnOpenChange}
        />
      ) : null}
    </div>
  );
}
