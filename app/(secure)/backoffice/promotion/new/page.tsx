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
import { TimeValue } from "@react-types/datepicker";
import { AddCircle, CloseCircle } from "@solar-icons/react/ssr";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

export default function NewPromotion() {
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
  }, [menuRequiredAddonCatQue, onOpen]);

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
    const data = Object.fromEntries(formData);
    console.log(data);
    const totalPrice = Number(data.totalPrice);
    menuQty &&
      menuQty.length > 0 &&
      !totalPrice &&
      formData.set("menuQty", JSON.stringify(menuQty));
    const name = data.name as string;
    const description = data.description as string;
    const discountAmount = Number(data.discount_amount);
    const startDate = data.start_date as string;
    const endDate = data.end_date as string;
    promotionImage && formData.append("image", promotionImage);
    const priority = Number(data.priority);

    if (isFoc) {
      formData.set("discount_type", "foc");
      formData.set("focMenu", JSON.stringify(focMenu));
    }
    const discountType = formData.get("discount_type");
    const conditions = [];
    const isValid = Boolean(
      name && description && startDate && endDate && priority
    );
    if (!isValid)
      return addToast({
        title: "Missing required field!",
        color: "danger",
      });

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
      setPromotionFormData(formData);
      setMenuRequiredAddonCatQue(menuRequiredAddonCat);
    } else {
      setCreating(true);
      const { isSuccess, message } = await createPromotion(formData);
      setCreating(false);
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
    setCreating(true);
    const {
      isSuccess: promotionSuccess,
      message: promotionMessage,
      promotionId,
    } = await createPromotion(promotionFormData);
    setCreating(false);
    addToast({
      title: promotionMessage,
      color: promotionSuccess ? "success" : "danger",
    });
    if (promotionSuccess) {
      router.back();
    }
    setCreatingMenuAddonCategory(true);
    const { isSuccess, message } = await createFocMenuAddonCategory({
      focAddonCategory,
      promotionId,
    });
    setCreatingMenuAddonCategory(false);
    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });
  };
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">New Promotion</h1>
      </div>
      <Form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            <Select
              size="sm"
              label="Discount type"
              variant="bordered"
              placeholder="Select type of discount"
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

          <div className="flex gap-2 justify-end w-full">
            <NumberInput
              size="sm"
              name="priority"
              label="Priority"
              variant="bordered"
              required
              isRequired
              defaultValue={1}
              min={1}
              className="w-24"
            />
            <Input
              size="sm"
              name="group"
              label="Group (Optional)"
              variant="bordered"
              type="string"
              className="flex-1 max-w-48"
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isFoc ? (
            <NumberInput
              size="sm"
              name="discount_amount"
              label="Discount amount"
              variant="bordered"
              min={1}
              fullWidth
              endContent={
                <div className="flex items-center h-full">
                  <label className="sr-only" htmlFor="discount_type">
                    Discount type
                  </label>
                  <select
                    className="outline-none border-0 bg-transparent text-foreground text-small cursor-pointer appearance-none focus:outline-none focus:ring-0 hover:bg-default-100 dark:hover:bg-default-50 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.25rem center",
                      backgroundSize: "1em 1em",
                      paddingRight: "1.5rem",
                      color: "inherit",
                    }}
                    id="discountType"
                    name="discount_type"
                  >
                    <option
                      value="percentage"
                      className="bg-background text-foreground dark:bg-gray-800 dark:text-white"
                    >
                      %
                    </option>
                    <option
                      value="fixedValue"
                      className="bg-background text-foreground dark:bg-gray-800 dark:text-white"
                    >
                      Ks
                    </option>
                  </select>
                </div>
              }
              required
              isRequired
            />
          ) : (
            <div />
          )}
          <Textarea
            size="sm"
            name="description"
            label="Description"
            className={isFoc ? "col-span-2" : ""}
            variant="bordered"
            required
            isRequired
            fullWidth
            minRows={2}
          />
        </div>
        {isFoc ? (
          <div className="border-2 border-default p-4 rounded-md w-full space-y-3 overflow-hidden">
            <h2 className="font-medium text-sm">FOC Menus</h2>
            <div className="items-center grid grid-cols-2 gap-2">
              {focMenu.map((item) => (
                <div
                  className="w-full flex items-center gap-2 justify-center"
                  key={item.id}
                >
                  <Select
                    size="sm"
                    label="Select Menu"
                    variant="bordered"
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
                    className="flex-1 min-w-0"
                  >
                    {menus.map((menu) => (
                      <SelectItem key={String(menu.id)}>{menu.name}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex gap-2 items-center">
                    <NumberInput
                      size="sm"
                      variant="bordered"
                      label="Quantity"
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
                      className="w-24 sm:w-28 flex-shrink-0"
                    />
                    {focMenu.length > 1 ? (
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => {
                          setFocMenu(
                            focMenu.filter((foc) => foc.id !== item.id)
                          );
                        }}
                        className="flex-shrink-0 sm:mt-0"
                      >
                        <CloseCircle className="size-5 text-primary" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full flex justify-center items-center">
              <Button
                variant="light"
                size="sm"
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
                <AddCircle className="size-6 text-primary" />
              </Button>
            </div>
            <p className="text-default-600 text-xs">
              * If there are required addon-categories, we will let you choose
              addons at the next step.
            </p>
          </div>
        ) : null}
        <div className="w-full space-y-3">
          <Select
            size="sm"
            label="Promotion type"
            variant="bordered"
            placeholder="Select type of promotion"
            className="w-full sm:w-48"
            selectedKeys={promotionType === "menu" ? "1" : "2"}
            onChange={(e) => {
              const value = e.target.value === "1" ? "menu" : "total";
              setPromotionType(value);
            }}
          >
            <SelectItem key="2">Total price</SelectItem>
            <SelectItem key="1">Menu</SelectItem>
          </Select>

          {promotionType === "menu" ? (
            <div className="space-y-3">
              <div className="gap-2 grid grid-cols-2">
                {menuQty.map((item: any) => (
                  <div className="flex items-start gap-2 w-full" key={item.id}>
                    <Select
                      size="sm"
                      label="Select Menu"
                      variant="bordered"
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
                      className="flex-1"
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
                            >
                              {menu.name}
                            </SelectItem>
                          );
                        return (
                          <SelectItem key={String(menu.id)}>
                            {menu.name}
                          </SelectItem>
                        );
                      })}
                    </Select>
                    <NumberInput
                      size="sm"
                      variant="bordered"
                      label="Quantity"
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
                      className="w-24"
                    />
                    {menuQty.length > 1 ? (
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        onPress={() => {
                          setMenuQty(
                            menuQty.filter((qty) => qty.id !== item.id)
                          );
                        }}
                        className="mt-6"
                      >
                        <CloseCircle className="size-5 text-primary" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="w-full flex justify-center items-center">
                <Button
                  size="sm"
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
                  <AddCircle className="size-6 text-primary" />
                </Button>
              </div>
            </div>
          ) : (
            <Input
              size="sm"
              name="totalPrice"
              label="Total price"
              variant="bordered"
              required
              isRequired
              endContent="Ks"
              className="w-full sm:w-1/2"
            />
          )}
        </div>
        <div className="w-full">
          <label className="text-sm font-medium mb-2 block">
            Promotion Image
          </label>
          {promotionImage ? (
            <div className="w-full flex rounded-md border border-gray-400 dark:border-gray-600 p-3 items-center justify-between bg-content1">
              <p className="truncate flex-1 mr-2">{promotionImage.name}</p>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setPromotionImage(null)}
              >
                <CloseCircle className="text-primary size-5" />
              </Button>
            </div>
          ) : (
            <FileDropZone onDrop={(files) => setPromotionImage(files[0])} />
          )}
        </div>

        <div className="w-full">
          <Accordion>
            <AccordionItem
              key="1"
              aria-label="More options"
              title="More Conditions (Optional)"
              isCompact
              className="w-full"
            >
              <div className="w-full space-y-4">
                <div className="w-full">
                  <div className="flex w-full gap-3 items-start">
                    <Select
                      size="sm"
                      label="Promotion days"
                      variant="bordered"
                      selectionMode="multiple"
                      placeholder="Select days"
                      selectedKeys={selectedDay}
                      onChange={handleSelectionChange}
                      isDisabled={!enableDay}
                      className="flex-1"
                    >
                      {days.map((day) => (
                        <SelectItem key={day.name}>{day.name}</SelectItem>
                      ))}
                    </Select>
                    <div className="flex items-center pt-8">
                      <Checkbox
                        size="md"
                        isSelected={enableDay}
                        onValueChange={setEnableDay}
                      >
                        Enable
                      </Checkbox>
                    </div>
                  </div>
                  {!enableDay && (
                    <p className="text-default-600 text-xs mt-2">
                      * If you do not set days, promotion will apply every day!
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <div className="flex w-full gap-3 items-start">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <TimeInput
                        size="sm"
                        label="Start time"
                        variant="bordered"
                        value={timePeriod?.startTime}
                        onChange={(e) => {
                          if (e) setTimePeriod({ ...timePeriod, startTime: e });
                        }}
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
                        onChange={(e) => {
                          if (e) setTimePeriod({ ...timePeriod, endTime: e });
                        }}
                        isRequired
                        fullWidth
                      />
                    </div>
                    <div className="flex items-center pt-8">
                      <Checkbox
                        size="md"
                        isSelected={enabelTime}
                        onValueChange={setTimeEnable}
                      >
                        Enable
                      </Checkbox>
                    </div>
                  </div>
                  {!enabelTime && (
                    <p className="text-default-600 text-xs mt-2">
                      * If you do not set time period, promotion will apply the
                      whole day!
                    </p>
                  )}
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex justify-end items-center gap-2 w-full pt-4 border-t border-default-200">
          <Button
            variant="light"
            onPress={() => router.back()}
            isDisabled={creating}
            size="sm"
          >
            Cancel
          </Button>
          <Button type="submit" color="primary" isDisabled={creating} size="sm">
            {creating ? (
              <>
                <span>Creating promotion</span>
                <Spinner color="white" variant="wave" size="sm" />
              </>
            ) : checkingRequiredAddonCat && isFoc && focMenu.length ? (
              <>
                <span>Checking menu have required addon category....</span>
                <Spinner color="white" variant="wave" size="sm" />
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </Form>
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
    </div>
  );
}
