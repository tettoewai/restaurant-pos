"use client";
import {
  updateMenuCategory,
  updatePromotion,
  updateTable,
} from "@/app/lib/backoffice/action";
import {
  fetchMenu,
  fetchMenuCategoryWithId,
  fetchPromotionMenuWithPromoId,
  fetchPromotionWithId,
  fetchTableWithId,
} from "@/app/lib/backoffice/data";
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  DateRangePicker,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  TimeInput,
} from "@nextui-org/react";
import { Menu, MenuCategory, Promotion, Table } from "@prisma/client";
import { useEffect, useState } from "react";
import { BiPlusCircle } from "react-icons/bi";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import useSWR from "swr";
import {
  parseDate,
  Time,
  parseAbsoluteToLocal,
  parseTime,
} from "@internationalized/date";
import { dateToString } from "@/function";
import { TimeValue } from "@react-types/datepicker";

interface Props {
  id: number;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  menus: Menu[] | undefined;
}

export default function UpdatePromotionDialog({
  id,
  isOpen,
  onOpenChange,
  onClose,
  menus,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, isLoading } = useSWR(isOpen && id ? [id, isOpen] : null, () =>
    fetchPromotionWithId(id)
  );

  const { data: promotionMenu, isLoading: promotionMenuLoading } = useSWR(
    data && isOpen ? [data, isOpen] : null,
    () => data && fetchPromotionMenuWithPromoId(data.id)
  );
  const prevMenuQty = promotionMenu?.map((item, index) => {
    return {
      id: index + 1,
      menuId: item.menuId,
      quantity: item.quantity_requried,
    };
  });

  const [menuQty, setMenuQty] = useState([{ id: 1, menuId: 0, quantity: 1 }]);

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

  const prevCondition =
    data?.conditions && JSON.parse(data.conditions as string);

  const handleSelectionChange = (e: any) => {
    const value = e.target.value;
    if (value.length === 0) {
      setSelectedDay(new Set());
    } else {
      setSelectedDay(new Set(e.target.value.split(",")));
    }
  };

  useEffect(() => {
    if (prevMenuQty) {
      setMenuQty(prevMenuQty);
    }
    if (prevCondition) {
      prevCondition &&
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
  }, [promotionMenu, data, prevCondition, prevMenuQty]);

  const handleClose = () => {
    setMenuQty([{ id: 1, menuId: 0, quantity: 1 }]);
    setSelectedDay(new Set([]));
    setTimePeriod({});
    setEnableDay(false);
    setTimeEnable(false);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const conditions: any = [];
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("menuQty", JSON.stringify(menuQty));
    formData.set("id", String(id));
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const discountAmount = Number(formData.get("discount_amount"));
    const discountType = formData.get("discount_type") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const isValid = Boolean(
      id &&
        name &&
        description &&
        discountAmount &&
        discountType &&
        startDate &&
        endDate &&
        menuQty.length > 0
    );
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
      handleClose();
      toast.success(message);
    } else {
      toast.error(message);
    }
  };
  if (!data) return;
  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        size="3xl"
        onClose={handleClose}
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Update Promotion
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              {isLoading && promotionMenuLoading ? (
                <Spinner size="sm" />
              ) : (
                <div className="flex flex-wrap w-full">
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
                    <Input
                      name="discount_amount"
                      label="Discount amount"
                      variant="bordered"
                      defaultValue={String(data?.discount_value)}
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
                  </div>
                  <div className="space-y-1 w-1/2 p-1">
                    {menuQty.map((item: any) => (
                      <div
                        className="flex w-full items-center space-x-1"
                        key={item.id}
                      >
                        <Select
                          label="Select Menu"
                          variant="bordered"
                          className="w-3/4"
                          required
                          isRequired
                          selectedKeys={item.menuId ? String(item.menuId) : ""}
                          onChange={(e) => {
                            const alreadyExist = Boolean(
                              menuQty.find(
                                (menuqty) =>
                                  menuqty.menuId === Number(e.target.value)
                              )
                            );
                            const updatedMenuQty = menuQty.map((menuqty) => {
                              if (menuqty.id === item.id && !alreadyExist) {
                                return {
                                  ...menuqty,
                                  menuId: Number(e.target.value),
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
                                  (menuQty) => menuQty.menuId === menu.id
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
                    <div className="w-full flex justify-center items-center mt-2">
                      <Button
                        variant="light"
                        onClick={() => {
                          const newMenuQty = {
                            id: menuQty[menuQty.length - 1].id + 1,
                            menuId: 0,
                            quantity: 1,
                          };
                          setMenuQty([...menuQty, newMenuQty]);
                        }}
                        isIconOnly
                      >
                        <BiPlusCircle className="size-7 text-primary" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-full">
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
                              label="Favorite Animal"
                              variant="bordered"
                              selectionMode="multiple"
                              placeholder="Select an animal"
                              selectedKeys={selectedDay}
                              onChange={handleSelectionChange}
                              isDisabled={!enableDay}
                            >
                              {days.map((day) => (
                                <SelectItem key={day.name}>
                                  {day.name}
                                </SelectItem>
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
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onClick={handleClose}
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
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
