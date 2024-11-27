"use client";
import { updatePromotion } from "@/app/lib/backoffice/action";
import {
  fetchFocCategoryAndFocMenu,
  fetchMenu,
  fetchPromotionMenuWithPromoId,
  fetchPromotionWithId,
} from "@/app/lib/backoffice/data";
import { dateToString } from "@/function";
import { parseDate, parseTime } from "@internationalized/date";
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  DateRangePicker,
  Input,
  Select,
  SelectItem,
  Spinner,
  TimeInput,
} from "@nextui-org/react";
import { DISCOUNT } from "@prisma/client";
import { TimeValue } from "@react-types/datepicker";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BiPlusCircle } from "react-icons/bi";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import useSWR from "swr";

export default function App({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useSWR(id ? [id] : null, () =>
    fetchPromotionWithId(id)
  );

  const { data: menus = [] } = useSWR("menus", () => fetchMenu());

  const { data: focData } = useSWR(id ? [`focData${id}`] : null, () =>
    fetchFocCategoryAndFocMenu(id)
  );
  const { data: promotionMenu, isLoading: promotionMenuLoading } = useSWR(
    data ? [data] : null,
    () => data && fetchPromotionMenuWithPromoId(data.id)
  );
  const prevMenuQty = useMemo(
    () =>
      promotionMenu?.map((item, index) => {
        return {
          id: index + 1,
          menuId: String(item.menuId),
          quantity: item.quantity_requried,
        };
      }),
    [promotionMenu]
  );
  const [isFoc, setIsFoc] = useState<boolean>(false);
  const [menuQty, setMenuQty] = useState([{ id: 1, menuId: "", quantity: 1 }]);

  const [focMenu, setFocMenu] = useState([
    { id: 1, menuId: [""], quantity: 1 },
  ]);

  const [promotionType, setPromotionType] = useState<"menu" | "total">("menu");

  const [enableDay, setEnableDay] = useState(false);
  const [enabelTime, setTimeEnable] = useState(false);

  const [timePeriod, setTimePeriod] = useState<{
    startTime?: TimeValue;
    endTime?: TimeValue;
  }>();

  const [selectedDay, setSelectedDay] = useState<Set<string>>(new Set([]));

  const days = [
    { name: "Sunday" },
    { name: "Monday" },
    { name: "Tuesday" },
    { name: "Wednesday" },
    { name: "Thursday" },
    { name: "Firday" },
    { name: "Saturday" },
  ];

  const prevCondition = useMemo(
    () => data && JSON.parse(data.conditions as string),
    [data]
  );

  const handleSelectionChange = (e: any) => {
    const value = e.target.value;
    if (value.length === 0) {
      setSelectedDay(new Set());
    } else {
      setSelectedDay(new Set(e.target.value.split(",")));
    }
  };

  useEffect(() => {
    if (prevMenuQty && prevMenuQty.length > 0) {
      setMenuQty(prevMenuQty);
    }
    const isMenu = Boolean(
      prevMenuQty && prevMenuQty?.length > 0 && !data?.totalPrice
    );
    setIsFoc(data?.discount_type === DISCOUNT.FOCMENU ? true : false);

    const prevFocMenu =
      focData &&
      focData.focCategory &&
      focData.focCategory.map((item, index) => {
        const validMenuId = focData.focMenu
          .filter((focmenu) => focmenu.focCategoryId === item.id)
          .map((focmenu) => String(focmenu.menuId));
        return { id: index, menuId: validMenuId, quantity: item.minSelection };
      });
    prevFocMenu && prevFocMenu.length && setFocMenu(prevFocMenu);
    setPromotionType(isMenu ? "menu" : "total");
    if (prevCondition && prevCondition.length) {
      prevCondition.map((item: any) => {
        if (item.startTime && item.endTime) {
          setTimeEnable(true);
          setTimePeriod({
            startTime: parseTime(item.startTime),
            endTime: parseTime(item.endTime),
          });
        }
        if (item.days) {
          setEnableDay(true);
          setSelectedDay(new Set(item.days));
        }
      });
    }
  }, [prevMenuQty, prevCondition, data, , isLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const conditions: any = [];
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const totalPrice = formData.get("totalPrice");
    menuQty &&
      menuQty.length &&
      !totalPrice &&
      formData.set("menuQty", JSON.stringify(menuQty));
    formData.set("id", String(id));
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const discountAmount = Number(formData.get("discount_amount"));
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    if (isFoc) {
      formData.set("discount_type", "foc");
      formData.set("focMenu", JSON.stringify(focMenu));
    }
    const discountType = formData.get("discount_type");
    const isValid = Boolean(name && description && startDate && endDate);

    if (isFoc) {
      const focValid =
        discountType === "foc" &&
        focMenu &&
        focMenu.length > 0 &&
        !discountAmount;
      if (!focValid) return toast.error("Missing required foc field!");
    }
    if (!isValid) return toast.error("Missing required field!");

    if (enabelTime) {
      const periodValid =
        timePeriod && timePeriod.startTime && timePeriod.endTime;

      if (!periodValid) return toast.error("Missing time period!");
      const timeCondition = {
        startTime: timePeriod.startTime?.toString(),
        endTime: timePeriod.endTime?.toString(),
      };
      conditions.push(timeCondition);
    }

    if (enableDay) {
      if (!selectedDay) return toast.error("Missing day!");
      const days = { days: Array.from(selectedDay) };
      conditions.push(days);
    }

    if (enableDay || enabelTime) {
      formData.set("conditions", JSON.stringify(conditions));
    }
    setIsSubmitting(true);
    const { isSuccess, message } = await updatePromotion(formData);
    setIsSubmitting(false);

    if (isSuccess) {
      toast.success(message);
      router.back();
    } else {
      toast.error(message);
    }
  };

  if (!data) return;

  return (
    <div className="bg-background p-2 rounded-md flex justify-center items-center">
      {isLoading || promotionMenuLoading ? (
        <Spinner size="sm" />
      ) : (
        <form onSubmit={handleSubmit} className="w-full">
          <span className="mb-2 font-semibold">Update Pomotion</span>
          <div className="mb-2">
            <div>
              <Select
                size="sm"
                label="Discount type"
                variant="bordered"
                placeholder="Select type of discount"
                className="w-40 mt-1"
                selectedKeys={isFoc ? "2" : "1"}
                onChange={(e) => {
                  const value = e.target.value === "1" ? false : true;
                  setIsFoc(value);
                }}
              >
                <SelectItem key="1">Discount</SelectItem>
                <SelectItem key="2">FOC</SelectItem>
              </Select>
            </div>
            <div className="flex flex-row">
              <div className="space-y-1 w-1/2 p-1">
                <Input
                  name="name"
                  label="Name"
                  variant="bordered"
                  required
                  isRequired
                  defaultValue={data?.name}
                />
                <Input
                  name="description"
                  label="Description"
                  variant="bordered"
                  required
                  isRequired
                  defaultValue={data?.description}
                />
              </div>
              <div className="space-y-1 w-1/2 p-1">
                <DateRangePicker
                  label="Promotion duration"
                  variant="bordered"
                  isRequired
                  startName="start_date"
                  endName="end_date"
                  defaultValue={{
                    start: parseDate(
                      dateToString({ date: data.start_date, type: "YMD" })
                    ),
                    end: parseDate(
                      dateToString({ date: data.end_date, type: "YMD" })
                    ),
                  }}
                />
                {!isFoc ? (
                  <Input
                    name="discount_amount"
                    label="Discount amount"
                    variant="bordered"
                    defaultValue={
                      data.discount_value ? String(data.discount_value) : ""
                    }
                    type="number"
                    endContent={
                      <div className="flex items-center h-full">
                        <label className="sr-only" htmlFor="discount_type">
                          Discount type
                        </label>
                        <select
                          className="outline-none border-0 bg-transparent text-default-400 text-small"
                          id="discountType"
                          name="discount_type"
                          defaultValue={
                            data?.discount_type === "PERCENTAGE"
                              ? "percentage"
                              : "fixedValue"
                          }
                        >
                          <option value="percentage">%</option>
                          <option value="fixedValue">Ks</option>
                        </select>
                      </div>
                    }
                    required
                    isRequired
                  />
                ) : null}
              </div>
            </div>
            {isFoc ? (
              <div className="border-2 border-default p-1 rounded-md mb-1">
                <span>FOC menus</span>
                <div className=" grid grid-cols-2 ">
                  {focMenu.map((item) => (
                    <div className="flex items-center" key={item.id}>
                      <Select
                        size="sm"
                        label="Select Menu"
                        variant="bordered"
                        className="w-3/4 mr-1"
                        selectionMode="multiple"
                        required
                        isRequired
                        selectedKeys={new Set(item.menuId)}
                        onChange={(e) => {
                          const value = new Set(
                            e.target.value
                              .split(",")
                              .filter((value) => value !== "")
                          );
                          const updatedFocMenu = focMenu.map((foc) => {
                            if (foc.id === item.id) {
                              return { ...item, menuId: Array.from(value) };
                            }
                            return foc;
                          });
                          setFocMenu(updatedFocMenu);
                        }}
                      >
                        {menus.map((menu) => (
                          <SelectItem
                            key={String(menu.id)}
                            value={String(menu.id)}
                          >
                            {menu.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        size="sm"
                        type="number"
                        variant="bordered"
                        label="Select"
                        className="w-1/4"
                        min={1}
                        max={item.menuId.length}
                        required
                        isRequired
                        value={String(item.quantity)}
                        onChange={(e) => {
                          const updatedFocMenu = focMenu.map((foc) => {
                            if (
                              foc.id === item.id &&
                              item.menuId.length >= Number(e.target.value)
                            ) {
                              return {
                                ...foc,
                                quantity: Number(e.target.value),
                              };
                            } else {
                              return foc;
                            }
                          });
                          setFocMenu(updatedFocMenu);
                        }}
                      />
                      {focMenu.length > 1 ? (
                        <Button
                          size="sm"
                          isIconOnly
                          variant="light"
                          className="size-16"
                          onClick={() => {
                            setFocMenu(
                              focMenu.filter((foc) => foc.id !== item.id)
                            );
                          }}
                        >
                          <RxCross2 className="size-5 text-primary" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="w-full flex justify-center items-center mt-1">
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => {
                      const newFocMenu = {
                        id: focMenu[focMenu.length - 1].id + 1,
                        menuId: [],
                        quantity: 1,
                      };
                      setFocMenu([...focMenu, newFocMenu]);
                    }}
                    isIconOnly
                  >
                    <BiPlusCircle className="size-7 text-primary" />
                  </Button>
                </div>
              </div>
            ) : null}
            <div>
              <Select
                label="Promotion type"
                variant="bordered"
                placeholder="Select type of promotion"
                className="w-40 mb-2"
                selectedKeys={promotionType === "menu" ? "1" : "2"}
                onChange={(e) => {
                  const value = e.target.value === "1" ? "menu" : "total";
                  setPromotionType(value);
                }}
              >
                <SelectItem key="1">Menu</SelectItem>
                <SelectItem key="2">Total price</SelectItem>
              </Select>
              <div>
                {promotionType === "menu" ? (
                  <>
                    <div className="space-y-1 w-full grid grid-cols-2">
                      {menuQty.map((item: any) => (
                        <div
                          className="flex items-center space-x-1"
                          key={item.id}
                        >
                          <Select
                            label="Select Menu"
                            variant="bordered"
                            className="w-3/4"
                            required
                            isRequired
                            selectedKeys={
                              item.menuId !== "" ? [String(item.menuId)] : []
                            }
                            onChange={(e) => {
                              const alreadyExist = Boolean(
                                menuQty.find(
                                  (menuqty) => menuqty.menuId === e.target.value
                                )
                              );
                              const updatedMenuQty = menuQty.map((menuqty) => {
                                if (menuqty.id === item.id && !alreadyExist) {
                                  return {
                                    ...menuqty,
                                    menuId: e.target.value,
                                  };
                                }
                                return menuqty;
                              });
                              setMenuQty(updatedMenuQty);
                            }}
                          >
                            {menus && menus.length > 0 ? (
                              menus.map((menu) => {
                                if (
                                  menuQty.find(
                                    (menuQty) =>
                                      menuQty.menuId === String(menu.id)
                                  )
                                )
                                  return (
                                    <SelectItem
                                      className="hidden"
                                      key={String(menu.id)}
                                      value={String(menu.id)}
                                    >
                                      {menu.name}
                                    </SelectItem>
                                  );
                                return (
                                  <SelectItem
                                    key={String(menu.id)}
                                    value={String(menu.id)}
                                  >
                                    {menu.name}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem className="hidden" key="">
                                There is no menu
                              </SelectItem>
                            )}
                          </Select>
                          <Input
                            type="number"
                            variant="bordered"
                            label="Qty"
                            className="w-1/4"
                            min={1}
                            max={100}
                            required
                            isRequired
                            value={String(item.quantity)}
                            onChange={(e) => {
                              const updatedMenuQty = menuQty.map((menuqty) => {
                                if (menuqty.id !== item.id) {
                                  return menuqty;
                                } else {
                                  return {
                                    ...menuqty,
                                    quantity: Number(e.target.value),
                                  };
                                }
                              });
                              setMenuQty(updatedMenuQty);
                            }}
                          />
                          {menuQty.length > 1 ? (
                            <Button
                              isIconOnly
                              variant="light"
                              className="size-16"
                              onClick={() => {
                                setMenuQty(
                                  menuQty.filter((qty) => qty.id !== item.id)
                                );
                              }}
                            >
                              <RxCross2 className="size-5 text-primary" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="w-full flex justify-center items-center mt-2">
                      <Button
                        variant="light"
                        onClick={() => {
                          const newMenuQty = {
                            id: menuQty[menuQty.length - 1].id + 1,
                            menuId: "",
                            quantity: 1,
                          };
                          setMenuQty([...menuQty, newMenuQty]);
                        }}
                        isIconOnly
                      >
                        <BiPlusCircle className="size-7 text-primary" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Input
                    name="totalPrice"
                    label="Tatal price"
                    variant="bordered"
                    defaultValue={
                      data.totalPrice ? String(data.totalPrice) : ""
                    }
                    required
                    isRequired
                    endContent="Ks"
                    className="w-1/2"
                  />
                )}
              </div>
            </div>

            <div>
              <Accordion>
                <AccordionItem
                  key="1"
                  aria-label="More options"
                  title="More Conditions"
                  isCompact
                  className="w-full"
                >
                  <div className="flex w-full justify-between mb-1">
                    <div className="w-11/12">
                      <Select
                        label="Promotion days"
                        variant="bordered"
                        selectionMode="multiple"
                        placeholder="Select days"
                        selectedKeys={selectedDay}
                        onChange={handleSelectionChange}
                        isDisabled={!enableDay}
                      >
                        {days.map((day) => (
                          <SelectItem key={day.name}>{day.name}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Checkbox
                      size="lg"
                      isSelected={enableDay}
                      onValueChange={setEnableDay}
                    />
                  </div>
                  <div className="flex w-full justify-between">
                    <div className="flex w-11/12 space-x-1">
                      <TimeInput
                        label="Start time"
                        variant="bordered"
                        value={timePeriod?.startTime}
                        onChange={(e) =>
                          setTimePeriod({ ...timePeriod, startTime: e })
                        }
                        isDisabled={!enabelTime}
                        isRequired
                      />
                      <TimeInput
                        label="End time"
                        variant="bordered"
                        isDisabled={!enabelTime}
                        value={timePeriod?.endTime}
                        onChange={(e) =>
                          setTimePeriod({ ...timePeriod, endTime: e })
                        }
                        isRequired
                      />
                    </div>
                    <Checkbox
                      size="lg"
                      isSelected={enabelTime}
                      onValueChange={setTimeEnable}
                    />
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="w-full flex justify-end items-center">
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onClick={() => router.back()}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              isDisabled={isSubmitting}
            >
              {isSubmitting ? <Spinner color="white" /> : "Update"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
