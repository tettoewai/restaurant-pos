"use client";
import {
  createFocMenuAddonCategory,
  createPromotion,
} from "@/app/lib/backoffice/action";
import { fetchMenu } from "@/app/lib/backoffice/data";
import ChooseRequiredAddonDialog from "@/components/ChooseRequiredAddonDialog";
import FileDropZone from "@/components/FileDropZone";
import { checkArraySame, checkMenuRequiredAddonCat } from "@/function";
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
  Textarea,
  TimeInput,
  useDisclosure,
} from "@nextui-org/react";
import { TimeValue } from "@react-types/datepicker";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BiPlusCircle } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { toast } from "react-toastify";
import useSWR from "swr";

export default function App() {
  const router = useRouter();
  const { data: menus = [] } = useSWR("menus", () => fetchMenu());

  const [menuQty, setMenuQty] = useState([{ id: 1, menuId: "", quantity: 1 }]);
  const [focMenu, setFocMenu] = useState([
    { id: 1, menuId: [""], quantity: 1 },
  ]);
  const [creating, setCreating] = useState(false);
  const [creatingMenuAddonCategory, setCreatingMenuAddonCategory] =
    useState(false);
  const [promotionFormData, setPromotionFormData] = useState<FormData>();
  const [enableDay, setEnableDay] = useState(false);
  const [enabelTime, setTimeEnable] = useState(false);
  const [promotionType, setPromotionType] = useState<"menu" | "total">("total");
  const [isFoc, setIsFoc] = useState<boolean>(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [timePeriod, setTimePeriod] = useState<{
    startTime?: TimeValue;
    endTime?: TimeValue;
  }>();

  const [selectedDay, setSelectedDay] = useState<Set<string>>(new Set([]));

  const [promotionImage, setPromotionImage] = useState<File | null>(null);

  const [focAddonCategory, setFocAddonCategory] = useState<
    { menuId: number; addonCategoryId: number; addonId: number }[]
  >([]);
  const [checkingRequiredAddonCat, setCheckingRequiredAddonCat] =
    useState(false);

  const [menuRequiredAddonCatQue, setMenuRequiredAddonCatQue] = useState<
    { menuId: number; addonCategoryIds: number[] }[]
  >([]);

  useEffect(() => {
    if (menuRequiredAddonCatQue.length) {
      onOpen();
    }
  }, [menuRequiredAddonCatQue]);

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
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    promotionImage && formData.append("image", promotionImage);
    const priority = formData.get("priority");

    if (isFoc) {
      formData.set("discount_type", "foc");
      formData.set("focMenu", JSON.stringify(focMenu));
    }

    const discountType = formData.get("discount_type");
    const conditions = [];
    const isValid = Boolean(
      name && description && startDate && endDate && priority
    );
    if (!isValid) return toast.error("Missing required field!");

    if (isFoc) {
      const focValid =
        discountType === "foc" &&
        focMenu &&
        focMenu.length > 0 &&
        !discountAmount;
      if (!focValid) return toast.error("Missing required foc field!");
    }

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
    const focMenuIds = focMenu.reduce((acc: number[], item) => {
      item.menuId.map((id) => {
        if (!acc.includes(Number(id))) {
          acc.push(Number(id));
        }
      });
      return acc;
    }, []);

    setCheckingRequiredAddonCat(true);

    const menuRequiredAddonCat = await checkMenuRequiredAddonCat(focMenuIds);

    setCheckingRequiredAddonCat(false);

    if (menuRequiredAddonCat.length) {
      setPromotionFormData(formData);
      setMenuRequiredAddonCatQue(menuRequiredAddonCat);
    } else {
      setCreating(true);
      const { isSuccess, message } = await createPromotion(formData);
      setCreating(false);
      if (isSuccess) {
        toast.success(message);
        router.back();
      } else {
        toast.error(message);
      }
    }
  };

  const handleSetAddonCategory = async () => {
    const requiredAddonCategoryId = menuRequiredAddonCatQue.filter((item) => {
      const validSelectedMenu = focAddonCategory.filter(
        (focAddonCat) => focAddonCat.menuId === item.menuId
      );
      const selectedAddonCat = validSelectedMenu.map(
        (item) => item.addonCategoryId
      );
      return checkArraySame(item.addonCategoryIds, selectedAddonCat);
    });
    const isValid =
      requiredAddonCategoryId.length === menuRequiredAddonCatQue.length;
    if (!isValid || !promotionFormData)
      return toast.error("Missing required addon");
    setCreating(true);
    const {
      isSuccess: promotionSuccess,
      message: promotionMessage,
      promotionId,
    } = await createPromotion(promotionFormData);
    setCreating(false);
    if (promotionSuccess) {
      toast.success(promotionMessage);
      router.back();
    } else {
      toast.error(promotionMessage);
    }
    setCreatingMenuAddonCategory(true);
    const { isSuccess, message } = await createFocMenuAddonCategory({
      focAddonCategory,
      promotionId,
    });
    setCreatingMenuAddonCategory(false);
    if (isSuccess) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };
  return (
    <div className="bg-background p-2 rounded-md">
      <ChooseRequiredAddonDialog
        creatingMenuAddonCategory={creatingMenuAddonCategory}
        handleSetAddonCategory={handleSetAddonCategory}
        menuRequiredAddonCatQue={menuRequiredAddonCatQue}
        isOpen={isOpen}
        onClose={onClose}
        onOpenChange={onOpenChange}
        menus={menus}
        focAddonCategory={focAddonCategory}
        setFocAddonCategory={setFocAddonCategory}
      />
      <div className="my-1 mb-3">
        <span className="font-semibold">New Promotion</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2">
            <div className="w-full pb-1 sm:pb-0">
              <Select
                size="sm"
                label="Discount type"
                variant="bordered"
                placeholder="Select type of discount"
                className="max-w-36"
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

            <div className="flex space-x-1 justify-end w-full">
              <Input
                size="sm"
                name="priority"
                label="Priority"
                variant="bordered"
                required
                type="number"
                isRequired
                defaultValue="1"
                min={1}
              />
              <Input
                size="sm"
                name="group"
                label="Group (Optional)"
                variant="bordered"
                type="string"
              />
            </div>
          </div>
          <div className="flex w-full flex-wrap my-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 w-full space-x-0 sm:space-x-1 space-y-1 sm:space-y-0">
              <Input
                size="sm"
                name="name"
                label="Name"
                variant="bordered"
                required
                isRequired
                autoFocus
                fullWidth
              />
              <DateRangePicker
                size="sm"
                label="Promotion duration"
                variant="bordered"
                isRequired
                startName="start_date"
                endName="end_date"
                fullWidth
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 w-full space-x-0 sm:space-x-1 space-y-1 sm:space-y-0 mt-1">
              {!isFoc ? (
                <Input
                  size="sm"
                  name="discount_amount"
                  label="Discount amount"
                  variant="bordered"
                  type="number"
                  min={1}
                  fullWidth
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
              ) : null}
              <Textarea
                size="sm"
                name="description"
                label="Description"
                variant="bordered"
                required
                isRequired
                fullWidth
              />
            </div>
          </div>
          {isFoc ? (
            <div className="border-2 border-default p-1 rounded-md mb-1">
              <span>FOC menus</span>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {focMenu.map((item) => (
                  <div className="flex items-center p-1" key={item.id}>
                    <Select
                      size="sm"
                      label="Select Menu"
                      variant="bordered"
                      className="w-3/4"
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
                      className="w-1/5"
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
              <span className="text-default-600 text-xs md:text-medium">
                * If there are required addon-categories, it will let you choose
                addons at the next step.
              </span>
            </div>
          ) : null}
        </div>
        <div>
          <Select
            size="sm"
            label="Promotion type"
            variant="bordered"
            placeholder="Select type of promotion"
            className="w-40 mb-1"
            selectedKeys={promotionType === "menu" ? "1" : "2"}
            onChange={(e) => {
              const value = e.target.value === "1" ? "menu" : "total";
              setPromotionType(value);
            }}
          >
            <SelectItem key="2">Total price</SelectItem>
            <SelectItem key="1">Menu</SelectItem>
          </Select>
          <div>
            {promotionType === "menu" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {menuQty.map((item: any) => (
                    <div className="flex items-center p-1" key={item.id}>
                      <Select
                        size="sm"
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
                        {menus.map((menu) => {
                          if (
                            menuQty.find(
                              (menuQty) => menuQty.menuId === String(menu.id)
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
                        size="sm"
                        type="number"
                        variant="bordered"
                        label="Qty"
                        className="w-1/5"
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
                          size="sm"
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
                    size="sm"
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
                size="sm"
                name="totalPrice"
                label="Tatal price"
                variant="bordered"
                required
                isRequired
                endContent="Ks"
                className="w-full sm:w-1/2"
              />
            )}
          </div>
        </div>
        <div className="mt-3">
          {promotionImage ? (
            <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
              <p className="truncate ...">{promotionImage.name}</p>
              <IoMdClose
                className="text-primary size-7 cursor-pointer"
                onClick={() => setPromotionImage(null)}
              />
            </div>
          ) : (
            <FileDropZone onDrop={(files) => setPromotionImage(files[0])} />
          )}
        </div>
        <div>
          <Accordion>
            <AccordionItem
              key="1"
              aria-label="More options"
              title="More Conditions (Optional)"
              isCompact
              className="w-full"
            >
              <div className="w-full mb-1 items-center">
                <div className="flex items-center w-full justify-between">
                  <div className="w-11/12 items-center">
                    <Select
                      size="sm"
                      label="Promotion days"
                      variant="bordered"
                      selectionMode="multiple"
                      placeholder="Select days"
                      selectedKeys={selectedDay}
                      onChange={handleSelectionChange}
                      isDisabled={!enableDay}
                      fullWidth
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
                    className="ml-1"
                  />
                </div>
                {!enableDay && (
                  <span className="text-default-700 text-sm block">
                    * If you do not set days, promotion will effect every days!
                  </span>
                )}
              </div>
              <div className="w-full items-center">
                <div className="flex w-full justify-between">
                  <div className="flex w-full">
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
                      fullWidth
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
                      fullWidth
                    />
                  </div>
                  <Checkbox
                    size="lg"
                    isSelected={enabelTime}
                    onValueChange={setTimeEnable}
                    className="ml-1"
                  />
                </div>

                {!enabelTime && (
                  <span className="text-default-700 text-sm block">
                    * If you do not set time period, promotion will be effect
                    the whole day!
                  </span>
                )}
              </div>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="flex justify-end items-center mt-1">
          <Button
            className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
            onClick={() => router.back()}
            isDisabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            isDisabled={creating}
          >
            {creating ? (
              <>
                <span>Creating promotion</span>
                <Spinner color="white" />
              </>
            ) : checkingRequiredAddonCat && isFoc && focMenu.length ? (
              <>
                <span>Checking menu have required addon category....</span>
                <Spinner color="white" />
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
