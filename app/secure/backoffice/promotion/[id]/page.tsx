"use client";
import {
  deleteFocMenuAddonCategoryWithPromoId,
  deletePromotionImage,
  updateFocMenuAddonCategory,
  updatePromotion,
} from "@/app/lib/backoffice/action";
import {
  fetchFocCategoryAndFocMenu,
  fetchFocMenuAddonCategoryWithPromotionId,
  fetchMenu,
  fetchPromotionMenuWithPromoId,
  fetchPromotionWithId,
} from "@/app/lib/backoffice/data";
import ChooseRequiredAddonDialog from "@/components/ChooseRequiredAddonDialog";
import FileDropZone from "@/components/FileDropZone";
import {
  checkArraySame,
  checkMenuRequiredAddonCat,
  dateToString,
} from "@/function";
import {
  Accordion,
  AccordionItem,
  addToast,
  Button,
  Checkbox,
  DateRangePicker,
  Form,
  Input,
  NumberInput,
  Select,
  SelectItem,
  Spinner,
  Textarea,
  TimeInput,
  useDisclosure,
} from "@heroui/react";
import { parseDate, parseTime, Time } from "@internationalized/date";
import { DiscountType } from "@prisma/client";
import { TimeValue } from "@react-types/datepicker";
import { AddCircle, CloseCircle } from "@solar-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

export default function App({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useSWR(id ? [id] : null, () =>
    fetchPromotionWithId(id)
  );

  const { data: focMenuAddonCatData } = useSWR(
    id ? `focMenuAddonCat-${id}` : undefined,
    () =>
      id
        ? fetchFocMenuAddonCategoryWithPromotionId(id)
        : Promise.resolve(undefined)
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
          quantity: item.quantity_required,
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
  const [promotionFormData, setPromotionFormData] = useState<FormData>();
  const [menuRequiredAddonCatQue, setMenuRequiredAddonCatQue] = useState<
    { menuId: number; addonCategoryIds: number[] }[]
  >([]);
  const [promotionImage, setPromotionImage] = useState<File | null>(null);
  const [prevImage, setPrevImage] = useState<String | null>();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [focAddonCategory, setFocAddonCategory] = useState<
    { menuId: number; addonCategoryId: number; addonId: number }[]
  >([]);
  const [creatingMenuAddonCategory, setCreatingMenuAddonCategory] =
    useState(false);

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
    () => data && data.conditions && JSON.parse(data.conditions as string),
    [data]
  );

  const [checkingRequiredAddonCat, setCheckingRequiredAddonCat] =
    useState(false);

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
    if (data?.imageUrl) {
      setPrevImage(data.imageUrl);
    }
    setIsFoc(data?.discount_type === DiscountType.FOCMENU ? true : false);

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
            startTime: toZonedDateTime(
              parseTime(item.startTime),
              "Asia/Yangon"
            ),
            endTime: toZonedDateTime(parseTime(item.endTime), "Asia/Yangon"),
          });
        }
        if (item.days) {
          setEnableDay(true);
          setSelectedDay(new Set(item.days));
        }
      });
    }
  }, [prevMenuQty, prevCondition, data, focData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const conditions: any = [];
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const totalPrice = Number(data.totalPrice);
    menuQty &&
      menuQty.length &&
      !totalPrice &&
      formData.set("menuQty", JSON.stringify(menuQty));
    formData.set("id", String(id));
    const name = data.name as string;
    const description = data.description as string;
    const discountAmount = Number(data.discount_amount);
    const startDate = data.start_date as string;
    const endDate = data.end_date as string;
    const priority = Number(data.priority);

    promotionImage && formData.append("image", promotionImage);
    if (isFoc) {
      formData.set("discount_type", "foc");
      formData.set("focMenu", JSON.stringify(focMenu));
    }
    const discountType = formData.get("discount_type");
    const isValid = Boolean(
      name && description && startDate && endDate && priority
    );

    if (isFoc) {
      const focValid =
        discountType === "foc" &&
        focMenu &&
        focMenu.length > 0 &&
        !discountAmount;
      if (!focValid)
        return addToast({
          title: "Missing required foc field!",
          color: "danger",
        });
    }
    if (!isValid)
      return addToast({
        title: "Missing required field!",
        color: "danger",
      });

    if (!prevImage) deletePromotionImage(id);
    if (enabelTime) {
      const periodValid =
        timePeriod && timePeriod.startTime && timePeriod.endTime;

      if (!periodValid)
        return addToast({
          title: "Missing time period!",
          color: "danger",
        });

      const timeCondition = {
        startTime: timePeriod.startTime?.toString(),
        endTime: timePeriod.endTime?.toString(),
      };
      conditions.push(timeCondition);
    }

    if (enableDay) {
      if (!selectedDay)
        return addToast({
          title: "Missing day!",
          color: "danger",
        });
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
      onOpen();
      setPromotionFormData(formData);
      focMenuAddonCatData &&
        setFocAddonCategory(
          focMenuAddonCatData
            .filter(
              (item) =>
                menuRequiredAddonCat
                  .map((requiredAdddonCat) => requiredAdddonCat.menuId)
                  .includes(item.menuId) &&
                menuRequiredAddonCat.filter((requiredAddonCat) =>
                  requiredAddonCat.addonCategoryIds.includes(
                    item.addonCategoryId
                  )
                ).length
            )
            .map((item) => {
              return {
                menuId: item.menuId,
                addonCategoryId: item.addonCategoryId,
                addonId: item.addonId,
              };
            })
        );
      setMenuRequiredAddonCatQue(menuRequiredAddonCat);
    } else {
      await deleteFocMenuAddonCategoryWithPromoId(id);
      setIsSubmitting(true);
      const { isSuccess, message } = await updatePromotion(formData);
      setIsSubmitting(false);
      addToast({
        title: message,
        color: isSuccess ? "success" : "danger",
      });
      if (isSuccess) {
        router.back();
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
      return addToast({
        title: "Missing required addon",
        color: "danger",
      });

    setCreatingMenuAddonCategory(true);
    const { isSuccess, message } = await updateFocMenuAddonCategory({
      focAddonCategory,
      promotionId: id,
    });
    setCreatingMenuAddonCategory(false);
    setIsSubmitting(true);
    const { isSuccess: promotionSuccess, message: promotionMessage } =
      await updatePromotion(promotionFormData);
    setIsSubmitting(false);
    addToast({
      title: message,
      color: promotionSuccess ? "success" : "danger",
    });
    if (promotionSuccess) {
      router.back();
    }
  };

  if (!data) return <div>There is no data.</div>;

  return (
    <div className="bg-background p-2 rounded-md flex justify-center items-center">
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
        promotionId={id}
      />
      {isLoading || promotionMenuLoading ? (
        <Spinner size="sm" />
      ) : (
        <Form onSubmit={handleSubmit} className="w-full">
          <span className="mb-4 font-semibold">Update Pomotion</span>
          <div className="my-2">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2">
              <div className="w-full pb-1 sm:pb-0">
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
              <div className="flex space-x-1 justify-end w-full">
                <NumberInput
                  size="sm"
                  name="priority"
                  label="Priority"
                  variant="bordered"
                  required
                  isRequired
                  defaultValue={data.priority}
                  min={1}
                />
                <Input
                  size="sm"
                  name="group"
                  label="Group (Optional)"
                  variant="bordered"
                  type="string"
                  defaultValue={data.group || ""}
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
                  defaultValue={data?.name}
                />
                {!isFoc ? (
                  <NumberInput
                    name="discount_amount"
                    label="Discount amount"
                    variant="bordered"
                    defaultValue={data.discount_value || undefined}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 w-full space-x-0 sm:space-x-1 space-y-1 sm:space-y-0 mt-1">
                <DateRangePicker
                  size="sm"
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
                <Textarea
                  size="sm"
                  name="description"
                  label="Description"
                  variant="bordered"
                  required
                  isRequired
                  defaultValue={data?.description}
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
                          <SelectItem key={String(menu.id)}>
                            {menu.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <NumberInput
                        size="sm"
                        variant="bordered"
                        label="Select"
                        className="w-1/5"
                        min={1}
                        max={item.menuId.length}
                        required
                        isRequired
                        value={item.quantity}
                        onChange={(e) => {
                          const updatedFocMenu = focMenu.map((foc) => {
                            if (
                              foc.id === item.id &&
                              item.menuId.length >= Number(e)
                            ) {
                              return {
                                ...foc,
                                quantity: Number(e),
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
                          onPress={() => {
                            setFocMenu(
                              focMenu.filter((foc) => foc.id !== item.id)
                            );
                          }}
                        >
                          <CloseCircle className="size-5 text-primary" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="w-full flex justify-center items-center mt-1">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => {
                      const newFocMenu = {
                        id: focMenu[focMenu.length - 1].id + 1,
                        menuId: [],
                        quantity: 1,
                      };
                      setFocMenu([...focMenu, newFocMenu]);
                    }}
                    isIconOnly
                  >
                    <AddCircle className="size-7 text-primary" />
                  </Button>
                </div>
                <span className="text-default-600 text-xs md:text-medium">
                  * If there are required addon-categories, it will let you
                  choose addons at the next step.
                </span>
              </div>
            ) : null}
            <div>
              <Select
                size="sm"
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
                                    >
                                      {menu.name}
                                    </SelectItem>
                                  );
                                return (
                                  <SelectItem key={String(menu.id)}>
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
                          <NumberInput
                            size="sm"
                            variant="bordered"
                            label="Qty"
                            className="w-1/5"
                            min={1}
                            max={100}
                            required
                            isRequired
                            value={item.quantity}
                            onChange={(e) => {
                              const updatedMenuQty = menuQty.map((menuqty) => {
                                if (menuqty.id !== item.id) {
                                  return menuqty;
                                } else {
                                  return {
                                    ...menuqty,
                                    quantity: Number(e),
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
                              onPress={() => {
                                setMenuQty(
                                  menuQty.filter((qty) => qty.id !== item.id)
                                );
                              }}
                            >
                              <CloseCircle className="size-5 text-primary" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="w-full flex justify-center items-center mt-2">
                      <Button
                        variant="light"
                        onPress={() => {
                          const newMenuQty = {
                            id: menuQty[menuQty.length - 1].id + 1,
                            menuId: "",
                            quantity: 1,
                          };
                          setMenuQty([...menuQty, newMenuQty]);
                        }}
                        isIconOnly
                      >
                        <AddCircle className="size-7 text-primary" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Input
                    size="sm"
                    name="totalPrice"
                    label="Tatal price"
                    variant="bordered"
                    defaultValue={
                      data.totalPrice ? String(data.totalPrice) : ""
                    }
                    required
                    isRequired
                    endContent="Ks"
                    className="w-full sm:w-1/2"
                  />
                )}
              </div>
            </div>
            <div className="mt-3">
              {prevImage ? (
                <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                  <span className="truncate ...">{prevImage}</span>
                  <CloseCircle
                    className="text-primary size-6x mr-3 cursor-pointer"
                    onClick={() => setPrevImage(null)}
                  />
                </div>
              ) : promotionImage ? (
                <div className="w-full flex rounded-md border border-gray-400 p-1 items-center h-12 justify-between">
                  <span className="truncate ...">{promotionImage.name}</span>
                  <CloseCircle
                    className="text-primary size-6x mr-3 cursor-pointer"
                    onClick={() => {
                      setPromotionImage(null);
                    }}
                  />
                </div>
              ) : (
                <FileDropZone
                  onDrop={(files) => {
                    setPromotionImage(files[0]);
                  }}
                />
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
                        * If you do not set days, promotion will effect every
                        days!
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
                          onChange={(e) => {
                            if (e)
                              setTimePeriod({ ...timePeriod, startTime: e });
                          }}
                          isDisabled={!enabelTime}
                          isRequired
                        />
                        <TimeInput
                          size="sm"
                          label="End time"
                          variant="bordered"
                          isDisabled={!enabelTime}
                          value={timePeriod?.endTime}
                          onChange={(e) => {
                            if (e) setTimePeriod({ ...timePeriod, endTime: e });
                          }}
                          isRequired
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
                        * If you do not set time period, promotion will be
                        effect the whole day!
                      </span>
                    )}
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="w-full flex justify-end items-center">
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={() => router.back()}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              isDisabled={isSubmitting || checkingRequiredAddonCat}
            >
              {isSubmitting ? (
                <>
                  <span>Updating promotion</span>
                  <Spinner color="white" />
                </>
              ) : checkingRequiredAddonCat && isFoc && focMenu.length ? (
                <>
                  <span>Checking menu have required addon category....</span>
                  <Spinner color="white" />
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
function toZonedDateTime(arg0: Time, arg1: string): TimeValue | undefined {
  throw new Error("Function not implemented.");
}
