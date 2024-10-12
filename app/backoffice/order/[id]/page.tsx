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
import { formatOrder } from "@/Generial";
import {
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
  Tooltip,
  User,
} from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { IoIosArrowDropdown } from "react-icons/io";
import { PiHandCoinsFill } from "react-icons/pi";
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
  const tabs = ["pending", "cooking", "complete"];
  const tableId = Number(params.id);

  const isUpdateLocation =
    typeof window !== "undefined"
      ? localStorage.getItem("isUpdateLocation")
      : null;

  const { data: checkTable } = useSWR([tableId, isUpdateLocation], () =>
    checkTableLocation(tableId).then((res) => res)
  );

  const { data: table } = useSWR([tableId], () =>
    fetchTableWithId(tableId).then((res) => res)
  );

  const { data = [], error } = useSWR(
    [tableId, param, isUpdateLocation],
    () => fetchOrderWithStatus({ tableId, status: param }).then((res) => res),
    { refreshInterval: 5000 }
  );

  const menuIds = data?.map((item) => item.menuId) as number[];
  const { data: menus } = useSWR(menuIds.length > 0 ? [data] : null, () =>
    fetchMenuWithIds(menuIds).then((res) => res)
  );

  const addonIds = data
    ?.map((item) => item.addonId)
    .filter((addon) => addon !== null);
  const { data: addons = [] } = useSWR(
    addonIds.length > 0 ? [addonIds] : null,
    () => fetchAddonWithIds(addonIds).then((res) => res)
  );

  const addonCatIds =
    addons.length > 0 ? addons.map((item) => item.addonCategoryId) : [];
  const { data: addonCategory = [] } = useSWR(
    addonCatIds.length > 0 ? [addons] : null,
    () => fetchAddonCategoryWithIds(addonCatIds).then((res) => res)
  );

  const orderData = data && formatOrder(data);

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

  return (
    <div className="flex w-full flex-col relative">
      {checkTable ? (
        <>
          <span className="flex md:absolute top-5 left-3">
            Order of {table?.name},{" "}
            {orderData.length && "Total price :" + orderData[0].totalPrice}
          </span>
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
              className="flex md:absolute top-2.5 right-2"
            >
              <PiHandCoinsFill color="white" className="size-5" />
            </Button>
          </Tooltip>
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
                {orderData.length > 0 ? (
                  <div className="p-1 w-full">
                    <Table aria-label="Order list">
                      <TableHeader>
                        <TableColumn>No.</TableColumn>
                        <TableColumn>Menu</TableColumn>
                        <TableColumn>Addon</TableColumn>
                        <TableColumn>Quantity</TableColumn>
                        <TableColumn>Status</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent="There is no order">
                        {orderData.map((item, index) => {
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
                              <TableCell>
                                <span className="text-wrap text-center">
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
                                    <DropdownItem key="paid">Paid</DropdownItem>
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
    </div>
  );
}
