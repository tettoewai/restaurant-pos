"use client";
import { updateOrderStatus } from "@/app/lib/backoffice/action";
import {
  checkTableLocation,
  fetchAddonCategoryWithIds,
  fetchAddonWithIds,
  fetchMenuWithIds,
  fetchOrderWithStatus,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import { getTotalPrice } from "@/app/lib/order/action";
import PaidAndPrintDialog from "@/components/PaidAndPrintDialog";
import QuantityDialog from "@/components/QuantityDialog";
import { BackOfficeContext } from "@/context/BackOfficeContext";
import { formatOrder, getUnpaidTotalPrice, OrderData } from "@/Generial";
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
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { IoIosArrowDropdown } from "react-icons/io";
import { toast } from "react-toastify";
import useSWR, { mutate } from "swr";
export default function App({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { orderStatus: string };
}) {
  const pathName = usePathname();
  const router = useRouter();
  const param = searchParams.orderStatus || "pending";
  const tabs = useMemo(() => ["pending", "cooking", "complete"], []);

  const tableId = Number(params.id);

  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
    }
  }, []);

  const { data: checkTable } = useSWR(
    [`table-location-${tableId}`, isUpdateLocation],
    () => checkTableLocation(tableId).then((res) => res)
  );

  const { data: table } = useSWR([tableId], () =>
    fetchTableWithId(tableId).then((res) => res)
  );

  const {
    data = [],
    error,
    isLoading,
  } = useSWR(
    [tableId, param, isUpdateLocation],
    () => fetchOrderWithStatus({ tableId, status: param }).then((res) => res),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

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
      .filter((order) => order !== null);
  }, [orderData, paid]);

  const handleStatusChange = async (status: string, itemId: string) => {
    const { message, isSuccess } = await updateOrderStatus({
      orderStatus: status,
      itemId,
    });

    if (isSuccess) {
      toast.success(message);
      mutate([tableId, param, isUpdateLocation]);
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
      };
      setPaid([...otherPaidItem, updatePaid]);
      return;
    }
    setPaid((prev) => [
      ...prev,
      {
        ...item,
        quantity: item.quantity,
      },
    ]);
  };

  const totalUnpidPrice = getUnpaidTotalPrice({
    orderData: unpaidOrderData,
    menus: menus,
    addons: addons,
  });

  return (
    <div className="flex w-full flex-col relative">
      {checkTable ? (
        <>
          <span className="flex md:absolute top-5 left-3">
            Order of {table?.name},{" "}
            {unpaidOrderData.length && "Total price :" + totalUnpidPrice}
          </span>
          <div className="absolute top-2.5 right-2">
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
            selectedKey={!param ? "pending" : param}
            onSelectionChange={(e) => {
              const params = new URLSearchParams(searchParams);
              e === "pending"
                ? params.delete("orderStatus")
                : params.set("orderStatus", String(e));
              router.replace(`${pathName}?${params.toString()}`);
            }}
            className="flex justify-center md:justify-end mr-12 mt-2"
          >
            {tabs.map((item) => (
              <Tab
                key={item}
                title={item.charAt(0).toUpperCase() + item.slice(1)}
              >
                {unpaidOrderData.length > 0 ? (
                  <div className="p-1 w-full">
                    <Table
                      aria-label="Order list"
                      className="bg-background rounded-md p-1"
                      removeWrapper
                    >
                      <TableHeader>
                        <TableColumn>No.</TableColumn>
                        <TableColumn>Menu</TableColumn>
                        <TableColumn>Addon</TableColumn>
                        <TableColumn>Quantity</TableColumn>
                        <TableColumn>Status</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent="There is no order">
                        {unpaidOrderData
                          .filter((item) => Number(item.quantity) > 0)
                          .map((item, index) => {
                            const validMenu =
                              menus &&
                              menus.find((menu) => menu.id === item.menuId);
                            const addonIds: number[] = JSON.parse(item.addons);
                            const validAddon = addons.filter((addon) =>
                              addonIds.includes(addon.id)
                            );

                            const addonCatAddon = validAddon.map((addon) => {
                              const validAddonCat = addonCategory.find(
                                (addonCat) =>
                                  addonCat.id === addon.addonCategoryId
                              );

                              return validAddonCat?.name + " : " + addon.name;
                            });
                            return (
                              <TableRow key={index + 1}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <User
                                    avatarProps={{
                                      radius: "sm",
                                      src:
                                        validMenu?.assetUrl ||
                                        "/default-menu.png",
                                    }}
                                    description={item.instruction}
                                    name={validMenu?.name}
                                  >
                                    {item.instruction}
                                  </User>
                                </TableCell>
                                <TableCell align="left">
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
                                        onClick={() => {}}
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
                                          if (item.status !== "COMPLETE")
                                            return;
                                          if (
                                            item.quantity &&
                                            item.quantity > 1
                                          ) {
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
                                      {param === "complete" ? (
                                        <DropdownItem key="paid">
                                          Paid
                                        </DropdownItem>
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
                ) : (
                  <span>There is no order yet</span>
                )}
              </Tab>
            ))}
          </Tabs>
        </>
      ) : (
        <span>There is no table</span>
      )}
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
