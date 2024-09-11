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
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tab,
  Tabs,
} from "@nextui-org/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IoIosArrowDropdown } from "react-icons/io";
import { toast } from "react-toastify";
import useSWR, { mutate } from "swr";

export default function App({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();
  const param = searchParams.get("orderStatus") || "pending";
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

  const { data = [], error } = useSWR([tableId, param, isUpdateLocation], () =>
    fetchOrderWithStatus({ tableId, status: param }).then((res) => res)
  );

  const menuIds = data?.map((item) => item.menuId) as number[];
  const { data: menus } = useSWR(
    menuIds.length > 0 ? [data] : null,
    () => fetchMenuWithIds(menuIds).then((res) => res),
    { refreshInterval: 10000 }
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
            Order of {table?.name}
          </span>
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
            className="flex justify-center md:justify-end mr-5 mt-2"
          >
            {tabs.map((item) => (
              <Tab
                key={item}
                title={item.charAt(0).toUpperCase() + item.slice(1)}
              >
                {orderData.length > 0 ? (
                  <div className="p-1 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2 w-full mt-4">
                      {orderData.map((item) => {
                        const validMenu =
                          menus &&
                          menus.find((menu) => menu.id === item.menuId);
                        const addonIds: number[] = JSON.parse(item.addons);
                        const validAddon = addons.filter((addon) =>
                          addonIds.includes(addon.id)
                        );
                        return (
                          <Card
                            key={item.itemId}
                            className="w-[10em] md:w-48 min-h-60"
                          >
                            <div className="h-1/2 w-full overflow-hidden flex items-center justify-center">
                              <Image
                                src={validMenu?.assetUrl || "/default-menu.png"}
                                alt="menu"
                                width={500}
                                height={500}
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            <div className="px-1 flex justify-between flex-col h-1/2 mb-2">
                              <div className="flex justify-between mt-1">
                                <span>{validMenu?.name}</span>
                                <span className="size-6 text-white rounded-full bg-primary text-center">
                                  {item.quantity}
                                </span>
                              </div>
                              <div className="text-xs font-thin mt-1">
                                {validAddon.map((addon) => {
                                  const validAddonCat = addonCategory.find(
                                    (addonCat) =>
                                      addonCat.id === addon.addonCategoryId
                                  );
                                  return (
                                    <div
                                      key={addon.id}
                                      className="flex justify-between"
                                    >
                                      <span>{validAddonCat?.name}</span>
                                      <span>{addon.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-sm font-thin mt-1 flex justify-between items-center">
                                <span className="text-sm">Status :</span>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      endContent={<IoIosArrowDropdown />}
                                      size="sm"
                                      variant="light"
                                      className="[p-1]"
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
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
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
