"use client";
import { updateOrder } from "@/app/lib/order/action";
import { AddonCatSkeleton } from "@/app/ui/skeletons";
import { OrderContext } from "@/context/OrderContext";
import { Button, Card, Checkbox, Chip, Textarea } from "@nextui-org/react";
import { Addon, AddonCategory, Order } from "@prisma/client";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import { toast } from "react-toastify";
import { formatCurrency } from "../[id]/page";
const { customAlphabet } = require("nanoid");

interface Props {
  menuId: number;
  addonCategory: AddonCategory[];
  addon: Addon[];
  order?: Order[] | null;
}

export default function MenuForm({
  addonCategory,
  addon,
  menuId,
  order,
}: Props) {
  interface SelectedAddon {
    categoryId: number;
    addonId: number;
  }
  const { carts, setCarts } = useContext(OrderContext);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const cartId = searchParams.get("cartId");
  const tableId = searchParams.get("tableId");
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

  const [quantity, setQuantity] = useState<number>(validCarts?.quantity || 1);
  const [instruction, setInstruction] = useState<string>(
    validCarts?.instruction || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
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
  const numbers = "0123456789";
  const generateNumericID = customAlphabet(numbers, 7);
  const handleCheckboxChange = (categoryId: number, addonId: number) => {
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

  const checkArraySame = (array1: number[], array2: number[]) => {
    if (array1.length !== array2.length) {
      return false;
    }

    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }
    return true;
  };

  if (!tableId) return null;

  const handleAddToCart = async () => {
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

      if (isSuccess) {
        setIsUpdating(false);
        toast.success(message);
        router.replace(`/order/active-order?tableId=${tableId}`);
      } else {
        setIsUpdating(false);
        toast.error(message);
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
                className={clsx("p-3 border bg-background", {
                  "border-primary": item.isRequired,
                })}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-lg">{item.name}</span>
                  {item.isRequired && (
                    <Chip className="bg-primary text-white">Required</Chip>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  {validAddon.map((valAddon) => (
                    <div
                      key={valAddon.id}
                      className="border rounded-md w-full flex justify-between items-center p-2 cursor-pointer"
                      onClick={() => handleCheckboxChange(item.id, valAddon.id)}
                    >
                      <Checkbox
                        size="lg"
                        isSelected={
                          selectedValue.find(
                            (selected) =>
                              selected.categoryId === item.id &&
                              selected.addonId === valAddon.id
                          ) !== undefined
                        }
                        onChange={() =>
                          handleCheckboxChange(item.id, valAddon.id)
                        }
                      >
                        {valAddon.name}
                      </Checkbox>

                      <span>+ {formatCurrency(valAddon.price)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Suspense>
          );
        })}
      </div>

      <Card className="mt-3 space-y-1 bg-background p-2">
        <span>Special instruction</span>
        <Textarea
          variant="bordered"
          color="secondary"
          fullWidth
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. No mayo"
        />
      </Card>
      {/* Add To Cart Button */}
      <div className="flex flex-wrap justify-between w-full fixed bottom-0 left-0 rounded-t-md z-20 bg-background p-2 space-x-2">
        <div className="flex space-x-1 w-[30%]">
          <button
            onClick={() => {
              if (quantity > 1) setQuantity(quantity - 1);
            }}
          >
            <CiCircleMinus className="size-6 text-primary" />
          </button>
          <div className="px-5 rounded-md flex justify-center items-center text-lg h-full bg-gray-200 dark:bg-gray-900">
            {quantity}
          </div>
          <button onClick={() => setQuantity(quantity + 1)}>
            <CiCirclePlus className="size-6 text-primary" />
          </button>
        </div>

        <Button
          isDisabled={isDisable}
          onClick={() => handleAddToCart()}
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
