"use client";
import { updateOrderStatus } from "@/app/lib/backoffice/action";
import {
  checkTableLocation,
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchOrderWithTableId,
} from "@/app/lib/backoffice/data";
import PaidAndPrintDialog from "@/components/PaidAndPrintDialog";
import QuantityDialog from "@/components/QuantityDialog";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { formatOrder, getTotalOrderPrice, OrderData } from "@/general";
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  useDisclosure,
  User,
} from "@nextui-org/react";
import { nanoid } from "nanoid";
import { useContext, useEffect, useMemo, useState } from "react";
import { IoIosArrowDropdown } from "react-icons/io";
import { toast } from "react-toastify";
import useSWR, { mutate } from "swr";
export default function App({ params }: { params: { id: string } }) {
  const tabs = useMemo(() => ["pending", "cooking", "complete"], []);

  const tableId = Number(params.id);

  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
    }
  }, []);

  useEffect(() => {
    if (tableId) {
      mutate([tableId, isUpdateLocation, params]);
    }
  }, [tableId, isUpdateLocation, params]);

  const { data: table } = useSWR(
    tableId ? [tableId, isUpdateLocation, params] : null,
    () => checkTableLocation(tableId).then((res) => res)
  );

  const {
    data = [],
    error,
    isLoading,
  } = useSWR(
    table && table.id ? [table.id, isUpdateLocation] : null,
    () => fetchOrderWithTableId({ tableId }).then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const [selected, setSelected] = useState("pending");

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const menuIds = data?.map((item) => item.menuId) as number[];
  const { data: menus } = useSWR(menuIds.length > 0 ? [menuIds] : null, () =>
    fetchMenuWithIds(menuIds).then((res) => res)
  );
  const addonIds = data
    ?.map((item) => item.addonId)
    .filter((addon) => addon !== null);
  const { data: addons = [] } = useSWR(
    addonIds.length > 0 ? [data] : null,
    () => fetchAddonWithIds(addonIds).then((res) => res)
  );

  const addonCatIds =
    addons.length > 0 ? addons.map((item) => item.addonCategoryId) : [];

  const { data: addonCategory = [] } = useSWR(
    addonCatIds.length > 0 ? [addons] : null,
    () => fetchAddonCategoryWithIds(addonCatIds).then((res) => res)
  );

  const orderData = formatOrder(data);

  const { paid, setPaid } = useContext(BackOfficeContext);

  const receiptCode = useMemo(
    () =>
      paid.length > 0 && paid[0].receiptCode ? paid[0].receiptCode : nanoid(6),
    [paid]
  );

  const date = new Date();

  const [quantityDialogData, setQuantityDialogData] = useState<OrderData>({
    itemId: "",
    addons: "",
    menuId: 0,
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
  const handleStatusChange = async (status: string, itemId: string) => {
    const { message, isSuccess } = await updateOrderStatus({
      orderStatus: status,
      itemId,
    });

    if (isSuccess) {
      toast.success(message);
      mutate([tableId, isUpdateLocation]);
    } else {
      toast.error(message);
    }
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
    orderData: unpaidOrderData,
    menus: menus,
    addons: addons,
  });
  if (!table) return <span>There is no table</span>;
  const completedOrder = unpaidOrderData.filter(
    (item) => item.status === "COMPLETE"
  );
  return (
    <div className="flex w-full flex-col relative">
      <span className="flex md:absolute top-5 left-3">
        Order of {table?.name},{" "}
        {unpaidOrderData.length && "Total price :" + totalUnpidPrice}
      </span>
      <div className="absolute mt-1.5 top-7 right-6 md:top-1 md:right-2">
        <PaidAndPrintDialog
          menus={menus}
          addons={addons}
          addonCategory={addonCategory}
          tableId={tableId}
        />
      </div>
      <Tabs
        aria-label="Options"
        color="primary"
        variant="bordered"
        selectedKey={selected}
        onSelectionChange={(e) => setSelected(e.toLocaleString())}
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
                  {selected === "complete" && completedOrder.length > 0 ? (
                    <Button
                      color="primary"
                      className="mb-2"
                      onClick={() => addAllPaid(completedOrder)}
                    >
                      Paid all
                    </Button>
                  ) : null}
                </div>
                <Table
                  aria-label="Order list"
                  removeWrapper
                  className="bg-background rounded-lg p-1 w-fit md:w-full"
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
                      const validMenu =
                        menus && menus.find((menu) => menu.id === item.menuId);
                      const addonIds: number[] = item.addons
                        ? JSON.parse(item.addons)
                        : [];
                      const validAddon = addons.filter((addon) =>
                        addonIds.includes(addon.id)
                      );

                      const addonCatAddon = validAddon.map((addon) => {
                        const validAddonCat = addonCategory.find(
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
                                src: validMenu?.assetUrl || "/default-menu.png",
                              }}
                              description={item.instruction}
                              name={validMenu?.name}
                            >
                              {item.instruction}
                            </User>
                          </TableCell>
                          <TableCell align="left" className="min-w-40">
                            <span className="text-wrap">
                              {addonCatAddon.length
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
                                  variant="light"
                                  color={
                                    item.status === "PENDING"
                                      ? "primary"
                                      : item.status === "COOKING"
                                      ? "warning"
                                      : "success"
                                  }
                                >
                                  {item.status &&
                                    item.status.charAt(0).toUpperCase() +
                                      item.status.slice(1)}
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Static Actions"
                                onAction={async (e) => {
                                  const status = String(e);
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
                                <DropdownItem key="pending">
                                  Pending
                                </DropdownItem>
                                <DropdownItem key="cooking">
                                  Cooking
                                </DropdownItem>
                                <DropdownItem key="complete">
                                  Complete
                                </DropdownItem>
                                {selected === "complete" ? (
                                  <DropdownItem key="paid">Paid</DropdownItem>
                                ) : (
                                  <DropdownItem className="hidden">
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
    </div>
  );
}
