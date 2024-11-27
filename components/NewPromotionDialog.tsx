"use client";
import { createPromotion } from "@/app/lib/backoffice/action";
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
  useDisclosure,
} from "@nextui-org/react";
import { Menu } from "@prisma/client";
import { TimeValue } from "@react-types/datepicker";
import React, { useState } from "react";
import { BiPlusCircle } from "react-icons/bi";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import MultipleSelector from "./MultipleSelector";
import ShortcutButton from "./ShortCut";

function NewPromotionDialog({ menus }: { menus: Menu[] }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [menuQty, setMenuQty] = useState([{ id: 1, menuId: "", quantity: 1 }]);
  const [creating, setCreating] = useState(false);
  const [enableDay, setEnableDay] = useState(false);
  const [enabelTime, setTimeEnable] = useState(false);
  const [promotionType, setPromotionType] = useState<"menu" | "total">("total");
  const [discountType, setDiscountType] = useState<"normal" | "foc">("normal");

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

  const handleSelectionChange = (e: any) => {
    const value = e.target.value;
    if (value.length === 0) {
      setSelectedDay(new Set());
    } else {
      setSelectedDay(new Set(e.target.value.split(",")));
    }
  };

  const handleClose = () => {
    onClose();
    setMenuQty([{ id: 1, menuId: "", quantity: 1 }]);
    setSelectedDay(new Set([]));
    setTimePeriod({});
    setEnableDay(false);
    setTimeEnable(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const totalPrice = formData.get("totalPrice");
    menuQty &&
      menuQty.length > 0 &&
      !totalPrice &&
      formData.set("menuQty", JSON.stringify(menuQty));
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const discountAmount = Number(formData.get("discount_amount"));
    const discountType = formData.get("discount_type") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;

    const conditions = [];
    const isValid = Boolean(
      name &&
        description &&
        discountAmount &&
        discountType &&
        startDate &&
        endDate
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

    setCreating(true);

    const { isSuccess, message } = await createPromotion(formData);
    setCreating(false);
    if (isSuccess) {
      handleClose();
      toast.success(message);
    } else {
      toast.error(message);
    }
  };
  return (
    <div>
      <Button
        onPress={onOpen}
        className="bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        <ShortcutButton
          onClick={() => onOpen()}
          keys={["command"]}
          letter="O"
        />
        New Promotion
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background scrollbar-hide overflow-x-scroll"
        placement="center"
        size="3xl"
        scrollBehavior="inside"
        onClose={handleClose}
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader>Create Promotion</ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div>
                <div>
                  <Select
                    size="sm"
                    label="Discount type"
                    variant="bordered"
                    placeholder="Select type of discount"
                    className="w-40"
                    selectedKeys={discountType === "normal" ? "1" : "2"}
                    onChange={(e) => {
                      const value = e.target.value === "1" ? "normal" : "foc";
                      setDiscountType(value);
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
                      autoFocus
                      size="sm"
                    />
                    <Input
                      name="description"
                      label="Description"
                      variant="bordered"
                      required
                      isRequired
                      size="sm"
                    />
                  </div>
                  <div className="space-y-1 w-1/2 p-1">
                    <DateRangePicker
                      label="Promotion duration"
                      variant="bordered"
                      isRequired
                      startName="start_date"
                      endName="end_date"
                      size="sm"
                    />
                    <Input
                      name="discount_amount"
                      label="Discount amount"
                      variant="bordered"
                      type="number"
                      size="sm"
                      endContent={
                        <div className="flex items-center h-full">
                          <label className="sr-only" htmlFor="discount_type">
                            Discount type
                          </label>
                          <select
                            className="outline-none border-0 bg-transparent text-default-400 text-small"
                            id="discountType"
                            name="discount_type"
                          >
                            <option value="percentage">%</option>
                            <option value="fixedValue">Ks</option>
                          </select>
                        </div>
                      }
                      required
                      isRequired
                    />
                  </div>
                </div>
              </div>
              <div>
                <Select
                  label="Promotion type"
                  variant="bordered"
                  placeholder="Select type of promotion"
                  className="w-40 mb-1"
                  size="sm"
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
                          <div className="flex items-center" key={item.id}>
                            <Select
                              label="Select Menu"
                              variant="bordered"
                              className="w-3/4"
                              size="sm"
                              required
                              isRequired
                              selectedKeys={
                                item.menuId !== "" ? [String(item.menuId)] : []
                              }
                              onChange={(e) => {
                                const alreadyExist = Boolean(
                                  menuQty.find(
                                    (menuqty) =>
                                      menuqty.menuId === e.target.value
                                  )
                                );
                                const updatedMenuQty = menuQty.map(
                                  (menuqty) => {
                                    if (
                                      menuqty.id === item.id &&
                                      !alreadyExist
                                    ) {
                                      return {
                                        ...menuqty,
                                        menuId: e.target.value,
                                      };
                                    }
                                    return menuqty;
                                  }
                                );
                                setMenuQty(updatedMenuQty);
                              }}
                            >
                              {menus.map((menu) => {
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
                              })}
                            </Select>
                            <Input
                              type="number"
                              variant="bordered"
                              label="Qty"
                              size="sm"
                              className="w-1/4"
                              min={1}
                              max={100}
                              required
                              isRequired
                              value={String(item.quantity)}
                              onChange={(e) => {
                                const updatedMenuQty = menuQty.map(
                                  (menuqty) => {
                                    if (menuqty.id !== item.id) {
                                      return menuqty;
                                    } else {
                                      return {
                                        ...menuqty,
                                        quantity: Number(e.target.value),
                                      };
                                    }
                                  }
                                );
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
                      <div className="w-full flex justify-center items-center mt-1">
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
                      size="sm"
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
                          size="sm"
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
                          size="sm"
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
                          size="sm"
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
            </ModalBody>
            <ModalFooter>
              <Button
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                onClick={() => {
                  handleClose();
                }}
                isDisabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                isDisabled={creating}
              >
                {creating ? <Spinner color="white" /> : "Create"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default NewPromotionDialog;
