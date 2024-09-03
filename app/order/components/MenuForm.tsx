"use client";
import { OrderContext } from "@/context/OrderContext";
import { Button, Card, Checkbox, Chip, Textarea } from "@nextui-org/react";
import { Addon, AddonCategory } from "@prisma/client";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
const { customAlphabet } = require("nanoid");

interface Props {
  menuId: number;
  addonCategory: AddonCategory[];
  addon: Addon[];
}

export default function MenuForm({ addonCategory, addon, menuId }: Props) {
  interface SelectedAddon {
    categoryId: number;
    addonId: number;
  }
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const cartId = searchParams.get("cartId");
  const tableId = searchParams.get("tableId");

  const { carts, setCarts } = useContext(OrderContext);
  const validCarts = carts.find((item) => item.id === cartId);
  useEffect(() => {
    if (!validCarts) {
      const params = new URLSearchParams(searchParams);
      params.delete("cartId");
      replace(`${pathname}?${params.toString()}`);
    }
  }, [validCarts]);
  const validAddonCat = addon.filter((item) =>
    validCarts?.addons.includes(item.id)
  );
  const validSelectedValue: SelectedAddon[] = validAddonCat.map((item) => {
    return { categoryId: item.addonCategoryId, addonId: item.id };
  });

  const [selectedValue, setSelectedValue] =
    useState<SelectedAddon[]>(validSelectedValue);

  const [quantity, setQuantity] = useState<number>(validCarts?.quantity || 1);
  const [instructions, setInstructions] = useState<string>(
    validCarts?.instructions || ""
  );
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

  const handleAddToCart = () => {
    setSelectedValue([]);
    setQuantity(1);
    setInstructions("");

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
          instructions,
        },
      ]);
      replace(`/order/cart?tableId=${tableId}`);
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
            instructions,
          },
        ]);
      }
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {addonCategory.map((item) => {
          const validAddon = addon.filter(
            (addon) => addon.addonCategoryId === item.id
          );
          return (
            <Card
              key={item.id}
              className={clsx("p-3 border", {
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

                    <span>+ {valAddon.price} Kyats</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 bg-background p-2">
        <span>Special instructions</span>
        <Textarea
          variant="faded"
          color="secondary"
          fullWidth
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
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
          className="text-white bg-primary w-[65%]"
        >
          {validCarts ? "Confirm menu" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
