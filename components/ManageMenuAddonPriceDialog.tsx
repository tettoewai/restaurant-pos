"use client";
import {
  deleteMenuAddonPrice,
  fetchMenuAddonPrices,
  upsertMenuAddonPrice,
} from "@/app/lib/backoffice/action";
import { fetchMenusForAddon } from "@/app/lib/backoffice/data";
import { formatCurrency } from "@/function";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Addon } from "@prisma/client";
import { DollarSign, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface Props {
  addon: Addon;
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
}

interface MenuAddonPrice {
  id: number;
  menuId: number;
  addonId: number;
  price: number;
  menu: {
    id: number;
    name: string;
  };
}

type FetchedMenu = {
  id: number;
  name: string;
  price: number;
};

export default function ManageMenuAddonPriceDialog({
  addon,
  isOpen,
  onOpenChange,
  onClose,
}: Props) {
  const [menus, setMenus] = useState<FetchedMenu[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [priceInputs, setPriceInputs] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  // Fetch menus that can use this addon
  useEffect(() => {
    if (isOpen && addon.id) {
      setIsLoadingMenus(true);
      fetchMenusForAddon(addon.id)
        .then((fetchedMenus) => {
          setMenus(fetchedMenus);
          // Initialize price inputs with default addon price
          const initialPrices: Record<number, number> = {};
          fetchedMenus.forEach((menu) => {
            initialPrices[menu.id] = addon.price;
          });
          setPriceInputs(initialPrices);
        })
        .catch((error) => {
          console.error("Error fetching menus:", error);
          addToast({
            title: "Failed to load menus",
            color: "danger",
          });
        })
        .finally(() => {
          setIsLoadingMenus(false);
        });
    }
  }, [isOpen, addon.id, addon.price]);

  // Fetch existing menu-specific prices
  const { data: existingPrices, mutate } = useSWR<MenuAddonPrice[]>(
    isOpen && addon.id ? `menu-addon-prices-${addon.id}` : null,
    () => fetchMenuAddonPrices(addon.id),
    {
      revalidateOnFocus: false,
    }
  );

  // Update price inputs when existing prices are loaded
  useEffect(() => {
    if (existingPrices && menus.length > 0) {
      const updatedPrices: Record<number, number> = {};
      menus.forEach((menu) => {
        const existingPrice = existingPrices.find(
          (map) => map.menuId === menu.id
        );
        updatedPrices[menu.id] = existingPrice
          ? existingPrice.price
          : addon.price;
      });
      setPriceInputs(updatedPrices);
    }
  }, [existingPrices, menus, addon.price]);

  const handlePriceChange = (menuId: number, value: number) => {
    setPriceInputs((prev) => ({
      ...prev,
      [menuId]: value,
    }));
  };

  const handleSavePrice = async (menuId: number) => {
    const price = priceInputs[menuId];
    if (price === undefined || isNaN(price) || price < 0) {
      addToast({
        title: "Please enter a valid price",
        color: "warning",
      });
      return;
    }

    setIsSaving((prev) => ({ ...prev, [menuId]: true }));
    const formData = new FormData();
    formData.append("menuId", String(menuId));
    formData.append("addonId", String(addon.id));
    formData.append("price", String(price));

    const { isSuccess, message } = await upsertMenuAddonPrice(formData);
    setIsSaving((prev) => ({ ...prev, [menuId]: false }));

    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });

    if (isSuccess) {
      mutate(); // Refresh the list
    }
  };

  const handleDeletePrice = async (menuId: number) => {
    const key = `${menuId}-${addon.id}`;
    setIsDeleting((prev) => ({ ...prev, [key]: true }));

    const { isSuccess, message } = await deleteMenuAddonPrice(menuId, addon.id);
    setIsDeleting((prev) => ({ ...prev, [key]: false }));

    addToast({
      title: message,
      color: isSuccess ? "success" : "danger",
    });

    if (isSuccess) {
      // Reset to default price
      setPriceInputs((prev) => ({
        ...prev,
        [menuId]: addon.price,
      }));
      mutate(); // Refresh the list
    }
  };

  const hasCustomPrice = (menuId: number) => {
    return existingPrices?.some(
      (map) => map.menuId === menuId && map.price !== addon.price
    );
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="bg-background"
      placement="center"
      isDismissable={false}
      scrollBehavior="inside"
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Manage Menu-Specific Prices for: {addon.name}
        </ModalHeader>
        <ModalBody className="w-full">
          <div className="mb-4 p-3 bg-default-100 rounded-lg">
            <p className="text-sm text-foreground/70">
              Default Price:{" "}
              <span className="font-semibold">
                {formatCurrency(addon.price)}
              </span>
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Set custom prices for specific menus. If no custom price is set,
              the default price will be used.
            </p>
          </div>

          {isLoadingMenus ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              No menus are linked to this addon&apos;s category. Please link the
              addon category to menus first.
            </div>
          ) : (
            <Table aria-label="Menu addon prices table">
              <TableHeader>
                <TableColumn>MENU NAME</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => {
                  const menuId = menu.id;
                  const currentPrice = priceInputs[menuId] ?? addon.price;
                  const isCustom = hasCustomPrice(menuId);
                  const key = `${menuId}-${addon.id}`;

                  return (
                    <TableRow key={menuId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{menu.name}</span>
                          {isCustom && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <NumberInput
                          value={currentPrice}
                          onValueChange={(value) =>
                            handlePriceChange(menuId, value)
                          }
                          min={0}
                          startContent={
                            <DollarSign className="text-default-400 size-4" />
                          }
                          className="max-w-32"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => handleSavePrice(menuId)}
                            isDisabled={isSaving[menuId]}
                            isLoading={isSaving[menuId]}
                          >
                            {isSaving[menuId] ? (
                              <Spinner size="sm" />
                            ) : isCustom ? (
                              "Update"
                            ) : (
                              "Set"
                            )}
                          </Button>
                          {isCustom && (
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              isIconOnly
                              onPress={() => handleDeletePrice(menuId)}
                              isDisabled={isDeleting[key]}
                              isLoading={isDeleting[key]}
                            >
                              {isDeleting[key] ? (
                                <Spinner size="sm" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
