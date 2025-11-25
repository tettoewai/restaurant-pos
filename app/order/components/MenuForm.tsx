"use client";
import { fetchMenuWithId } from "@/app/lib/backoffice/data";
import { updateOrder } from "@/app/lib/order/action";
import { fetchAddonAvailability } from "@/app/lib/order/data";
import { AddonCatSkeleton } from "@/app/ui/skeletons";
import { OrderContext } from "@/context/OrderContext";
import { checkArraySame, formatCurrency } from "@/function";
import {
  addToast,
  Button,
  Card,
  Checkbox,
  Chip,
  Textarea,
} from "@heroui/react";
import { Addon, AddonCategory, Order } from "@prisma/client";
import { AddCircle, MinusCircle } from "@solar-icons/react/ssr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { customAlphabet } from "nanoid";

interface Props {
  menuId: number;
  addonCategory: AddonCategory[];
  addon: Addon[];
  order?: Order[] | null;
  addonPrices: Record<number, number>;
}
interface SelectedAddon {
  categoryId: number;
  addonId: number;
}
export default function MenuForm({
  addonCategory,
  addon,
  menuId,
  order,
  addonPrices,
}: Props) {
  const { carts, setCarts } = useContext(OrderContext);
  const { promotionQue, setPromotionQue } = useContext(OrderContext);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const cartId = searchParams.get("cartId");
  const tableId = searchParams.get("tableId");
  const requiredQty = Number(searchParams.get("requiredQty"));
  const promotionId = Number(searchParams.get("promotionId"));

  const validCarts = carts.find((item) => item.id === cartId);
  const validAddonOrderId = useMemo(() => {
    return order?.map((item) => item.addonId);
  }, [order]);
  const validAddonOrder = useMemo(() => {
    return addon.filter((item) => validAddonOrderId?.includes(item.id));
  }, [addon, validAddonOrderId]);

  const validSelectedValueOrder: SelectedAddon[] = useMemo(() => {
    return validAddonOrder.map((item) => ({
      categoryId: item.addonCategoryId,
      addonId: item.id,
    }));
  }, [validAddonOrder]);
  useEffect(() => {
    if (!validCarts) {
      const params = new URLSearchParams(searchParams);
      params.delete("cartId");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [validCarts, searchParams, pathname, router]);
  const validAddonCat = addon.filter((item) =>
    validCarts?.addons.includes(item.id)
  );
  const validSelectedValue: SelectedAddon[] = validAddonCat.map((item) => {
    return { categoryId: item.addonCategoryId, addonId: item.id };
  });

  const sortedAddonCategory = [...addonCategory].sort((a, b) => {
    if (a.isRequired && !b.isRequired) return -1;
    if (!a.isRequired && b.isRequired) return 1;
    return 0;
  });

  const [selectedValue, setSelectedValue] =
    useState<SelectedAddon[]>(validSelectedValue);

  const [quantity, setQuantity] = useState<number>(
    validCarts?.quantity || requiredQty || 1
  );
  const [instruction, setInstruction] = useState<string>(
    validCarts?.instruction || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch addon availability
  const addonIds = useMemo(() => addon.map((a) => a.id), [addon]);
  const { data: addonAvailability } = useSWR(
    menuId && addonIds.length > 0 ? [menuId, addonIds] : null,
    ([menuId, addonIds]: [number, number[]]) =>
      fetchAddonAvailability(menuId, addonIds),
    { revalidateOnFocus: false }
  );

  // Fetch menu data for price calculation
  const { data: menu } = useSWR(
    menuId ? `menu-${menuId}` : null,
    () => fetchMenuWithId(menuId),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (order) {
      setSelectedValue(validSelectedValueOrder);
      setQuantity(order[0].quantity - order[0].paidQuantity);
      order[0].instruction && setInstruction(order[0].instruction);
    }
  }, [order, validSelectedValueOrder]);
  const requiredCat = addonCategory.filter((item) => item.isRequired);
  const selectedCat = selectedValue.map((item) => item.categoryId);
  const isDisable =
    requiredCat
      .map((addonCat) => addonCat.id)
      .filter((item) => selectedCat.includes(item)).length !==
    requiredCat.length;

  // Calculate total price with menu-specific addon prices
  const totalPrice = useMemo(() => {
    if (!menu) return 0;
    const addonTotal = selectedValue.reduce((acc, item) => {
      const selectedAddonItem = addon.find((a) => a.id === item.addonId);
      const price =
        addonPrices?.[item.addonId] ?? selectedAddonItem?.price ?? 0;
      return acc + price;
    }, 0);
    return (menu.price + addonTotal) * quantity;
  }, [menu, selectedValue, addon, addonPrices, quantity]);
  const numbers = "0123456789";
  const generateNumericID = customAlphabet(numbers, 7);
  const handleCheckboxChange = (categoryId: number, addonId: number) => {
    // Prevent selecting unavailable addons
    const availability = addonAvailability?.get(addonId);
    if (
      availability &&
      (!availability.hasIngredients || !availability.isOrderable)
    ) {
      addToast({
        title: "This addon is currently unavailable",
        color: "warning",
      });
      return;
    }

    setSelectedValue((prevSelected) => {
      const alreadySelected = prevSelected.find(
        (item) => item.categoryId === categoryId && item.addonId === addonId
      );
      if (alreadySelected) {
        // If the addon is already selected and the category is required, remove it
        if (!addonCategory.find((cat) => cat.id === categoryId)?.isRequired) {
          return prevSelected.filter(
            (item) =>
              !(item.categoryId === categoryId && item.addonId === addonId)
          );
        }
        return prevSelected; // If it's required, do nothing
      } else {
        // If it's not selected, add it to the selected values
        const filtered = prevSelected.filter(
          (item) => item.categoryId !== categoryId
        );
        return [...filtered, { categoryId, addonId }];
      }
    });
  };

  if (!tableId) return null;

  const handleAddToCart = async () => {
    if (promotionId) {
      const updatedPromotionQue = promotionQue.filter(
        (item) => item.menuId !== menuId
      );
      setPromotionQue(updatedPromotionQue);
      if (updatedPromotionQue && updatedPromotionQue.length) {
        const url = `/order/${updatedPromotionQue[0].menuId}?tableId=${tableId}&promotionId=${updatedPromotionQue[0].promotionId}&requiredQty=${updatedPromotionQue[0].quantity_required}`;
        router.push(url);
      } else {
        router.push(`/order/cart?tableId=${tableId}`);
      }
    }
    setSelectedValue([]);
    setQuantity(1);
    setInstruction("");
    if (validSelectedValueOrder && order) {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append("itemId", order[0].itemId);
      formData.append("quantity", String(quantity));
      const addonIds = selectedValue.map((item) => item.addonId);
      formData.append("addonIds", JSON.stringify(addonIds));
      formData.append("instruction", instruction);
      const { isSuccess, message } = await updateOrder(formData);
      addToast({
        title: message,
        color: isSuccess ? "success" : "danger",
      });
      if (isSuccess) {
        setIsUpdating(false);
        router.replace(`/order/active-order?tableId=${tableId}`);
      } else {
        setIsUpdating(false);
      }
      return;
    }
    const isExist = carts.find(
      (item) =>
        item.menuId === menuId &&
        checkArraySame(
          item.addons,
          selectedValue.map((item) => item.addonId)
        )
    );

    if (validCarts) {
      const otherCarts = carts.filter((item) => item.id !== validCarts.id);
      setCarts([
        ...otherCarts,
        {
          ...validCarts,
          quantity: quantity,
          addons: selectedValue.map((item) => item.addonId),
          instruction,
        },
      ]);
      router.replace(`/order/cart?tableId=${tableId}`);
    } else {
      if (isExist) {
        const otherItem = carts.filter((item) => item.id !== isExist.id);
        setCarts([
          ...otherItem,
          { ...isExist, quantity: isExist.quantity + quantity },
        ]);
      } else {
        setCarts([
          ...carts,
          {
            id: generateNumericID(),
            menuId,
            addons: selectedValue.map((item) => item.addonId),
            quantity,
            instruction,
          },
        ]);
      }
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {sortedAddonCategory.map((item) => {
          const validAddon = addon.filter(
            (addon) => addon.addonCategoryId === item.id
          );
          return (
            <Suspense key={item.id} fallback={<AddonCatSkeleton />}>
              <Card
                className={`p-3 border bg-background ${
                  item.isRequired ? "border-primary" : ""
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-lg">{item.name}</span>
                  {item.isRequired && (
                    <Chip className="bg-primary text-white">Required</Chip>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  {validAddon
                    .filter((valAddon) => {
                      // Hide addons without ingredients configured
                      const availability = addonAvailability?.get(valAddon.id);
                      return availability?.hasIngredients !== false;
                    })
                    .map((valAddon) => {
                      const availability = addonAvailability?.get(valAddon.id);
                      const isOrderable = availability?.isOrderable !== false;
                      const isUnavailable =
                        availability?.hasIngredients &&
                        !availability?.isOrderable;

                      return (
                        <div
                          key={valAddon.id}
                          className={`border rounded-md w-full flex justify-between items-center p-2 ${
                            isOrderable
                              ? "cursor-pointer hover:bg-default-100"
                              : "opacity-50 cursor-not-allowed bg-default-50"
                          }`}
                          onClick={() => {
                            if (isOrderable) {
                              handleCheckboxChange(item.id, valAddon.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              size="lg"
                              isSelected={
                                selectedValue.find(
                                  (selected) =>
                                    selected.categoryId === item.id &&
                                    selected.addonId === valAddon.id
                                ) !== undefined
                              }
                              isDisabled={!isOrderable}
                              onChange={() =>
                                handleCheckboxChange(item.id, valAddon.id)
                              }
                            >
                              {valAddon.name}
                            </Checkbox>
                            {isUnavailable && (
                              <Chip size="sm" color="danger" variant="flat">
                                Out of Stock
                              </Chip>
                            )}
                          </div>

                          <p>
                            +{" "}
                            {formatCurrency(
                              addonPrices?.[valAddon.id] ?? valAddon.price
                            )}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </Suspense>
          );
        })}
      </div>

      <Card className="mt-3 space-y-1 bg-background p-2">
        <span>Special instruction (Optional)</span>
        <Textarea
          variant="bordered"
          color="secondary"
          fullWidth
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. No mayo"
        />
      </Card>
      {/* Total Price Display */}
      {menu && (
        <Card className="mt-3 bg-background p-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </Card>
      )}

      {/* Add To Cart Button */}
      <div className="flex flex-wrap justify-between w-full fixed bottom-0 left-0 rounded-t-md z-20 bg-background p-2 space-x-2">
        <div className="flex space-x-1 w-[30%]">
          <button
            onClick={() => {
              const minQty = requiredQty || 1;
              if (quantity > minQty) setQuantity(quantity - 1);
            }}
          >
            <MinusCircle className="size-6 text-primary" />
          </button>
          <div className="px-5 rounded-md flex justify-center items-center text-lg h-full bg-gray-200 dark:bg-gray-900">
            {quantity}
          </div>
          <button onClick={() => setQuantity(quantity + 1)}>
            <AddCircle className="size-6 text-primary" />
          </button>
        </div>

        <Button
          isDisabled={isDisable}
          onPress={() => handleAddToCart()}
          disabled={isUpdating}
          className="text-white bg-primary w-[65%]"
        >
          {validCarts
            ? "Confirm cart"
            : order && order?.length > 0
            ? "Update order"
            : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
