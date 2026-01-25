"use client";
import { AddonIngredientDataType } from "@/app/(secure)/warehouse/addon-ingredient/page";
import DeleteAddonIngredientDialog from "@/app/(secure)/warehouse/components/DeleteAddonIngredient";
import DeleteSupplierDialog from "@/app/(secure)/warehouse/components/DeleteSupplierDialog";
import DeleteWarehouseDialog from "@/app/(secure)/warehouse/components/DeleteWarehouseDialog";
import DeleteWarehouseItemDialog from "@/app/(secure)/warehouse/components/DeleteWarehouseItemDialog";
import EditMenuIngredient from "@/app/(secure)/warehouse/components/EditMenuIngredient";
import UpdateSupplierDialog from "@/app/(secure)/warehouse/components/UpdateSupplierDialog";
import UpdateWarehouseDialog from "@/app/(secure)/warehouse/components/UpdateWarehouseDialog";
import UpdateWarehouseItemDialog from "@/app/(secure)/warehouse/components/UpdateWarehouseItemDialog";
import {
  handleActivePromotion,
  handleDisableLocationMenu,
  handleDisableLocationMenuCat,
} from "@/app/lib/backoffice/action";
import { OrderData } from "@/general";
import {
  addToast,
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
  Switch,
  useDisclosure,
} from "@heroui/react";
import {
  Addon,
  AddonCategory,
  AddonIngredient,
  DisabledLocationMenu,
  DisabledLocationMenuCategory,
  Menu,
  MenuCategory,
  MenuCategoryMenu,
  MenuItemIngredient,
  Promotion,
  Supplier,
  Table,
  Warehouse,
  WarehouseItem,
} from "@prisma/client";
import { MenuDots, PenNewSquare, TrashBinTrash } from "@solar-icons/react/ssr";
import { DollarSign, MapPinOff } from "lucide-react";
import { useEffect, useState } from "react";
import CancelOrderDialog from "./CancelOrderDialog";
import DeleteAddonCategoryDialog from "./DeleteAddonCategoryDailog";
import DeleteAddonDialog from "./DeleteAddonDailog";
import DeleteLocationDialog from "./DeleteLocationDailog";
import DeleteMenuCategoryDialog from "./DeleteMenuCategoryDailog";
import DeleteMenuDialog from "./DeleteMenuDailog";
import DeletePromotionDailog from "./DeletePromotionDialog";
import DeleteTableDialog from "./DeleteTableDailog";
import ManageMenuAddonPriceDialog from "./ManageMenuAddonPriceDialog";
import QrcodePrint from "./QrcodePrint";
import UpdateAddonCategoryDialog from "./UpdateAddonCategoryDailog";
import UpdateAddonDialog from "./UpdateAddonDailog";
import UpdateAddonIngredientDialog from "./UpdateAddonIngredient";
import UpdateLocationDialog from "./UpdateLocationDailog";
import UpdateMenuCategoryDialog from "./UpdateMenuCategoryDailog";
import UpdateMenuDialog from "./UpdateMenuDailog";
import UpdateTableDialog from "./UpdateTableDailog";
interface Props {
  id: number;
  itemType:
  | "menu"
  | "menuCategory"
  | "addonCategory"
  | "addon"
  | "table"
  | "location"
  | "activeOrder"
  | "order"
  | "promotion"
  | "warehouse"
  | "warehouseItem"
  | "ingredient"
  | "supplier"
  | "addonIngredient"
  | "warehouseStock";
  categories?: MenuCategory[];
  menus?: Menu[];
  menu?: Menu;
  addon?: Addon;
  addonCategory?: AddonCategory[];
  table?: Table;
  disableLocationMenuCat?: DisabledLocationMenuCategory[];
  disableLocationMenu?: DisabledLocationMenu[];
  orderData?: OrderData;
  promotion?: Promotion;
  tableId?: number;
  qrCodeData?: string;
  warehouse?: Warehouse;
  isNotDeletable?: Boolean;
  warehouseItem?: WarehouseItem;
  ingredients?: MenuItemIngredient[];
  warehouseItems?: WarehouseItem[];
  supplier?: Supplier;
  addons?: Addon[];
  addonIngredientData?: AddonIngredientDataType;
  addonIngredients?: AddonIngredient[];
  menuCategoryMenu?: MenuCategoryMenu[];
  onEditMenu?: (id: number, menu: Menu, menuCategoryMenu: MenuCategoryMenu[]) => void;
  onEditMenuCategory?: (id: number) => void;
  onEditAddon?: (id: number, addon: Addon) => void;
  onEditAddonCategory?: (id: number) => void;
  onEditTable?: (id: number) => void;
  onEditLocation?: (id: number) => void;
}

export default function MoreOptionButton({
  id,
  itemType,
  categories,
  menus,
  addon,
  addonCategory,
  table,
  disableLocationMenuCat,
  disableLocationMenu,
  orderData,
  tableId,
  promotion,
  qrCodeData,
  warehouse,
  warehouseItem,
  isNotDeletable,
  menu,
  ingredients,
  warehouseItems,
  supplier,
  addons,
  addonIngredientData,
  addonIngredients,
  menuCategoryMenu,
  onEditMenu,
  onEditMenuCategory,
  onEditAddon,
  onEditAddonCategory,
  onEditTable,
  onEditLocation,
}: Props) {
  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onOpenChange: onUpdateOpenChange,
    onClose: onUpdateClose,
  } = useDisclosure();

  // Store the selected menu item for update dialog (only if onEditMenu is not provided)
  const [selectedMenuForUpdate, setSelectedMenuForUpdate] = useState<{
    id: number;
    menu?: Menu;
    menuCategoryMenu?: MenuCategoryMenu[];
  } | null>(null);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isManagePriceOpen,
    onOpen: onManagePriceOpen,
    onOpenChange: onManagePriceOpenChange,
    onClose: onManagePriceClose,
  } = useDisclosure();
  const iconClasses = "text-xl text-default-500 pointer-events-none shrink-0";
  const [available, setAvailable] = useState<boolean>(false);
  const [availableIsLoading, setAvailableIsLoading] = useState<boolean>(false);
  const [availableMenuCat, setAvailableMenuCat] = useState<boolean>(false);

  // Use state to prevent hydration mismatch with localStorage
  const [isUpdateLocation, setIsUpdateLocation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize localStorage value after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    setIsUpdateLocation(localStorage.getItem("isUpdateLocation"));
  }, []);

  // Listen for storage changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isUpdateLocation") {
        setIsUpdateLocation(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  useEffect(() => {
    if (promotion) {
      setAvailable(promotion.is_active);
    }
    const getDisableLocationMenu = async () => {
      if (itemType === "menu") {
        const isExist =
          disableLocationMenu &&
          disableLocationMenu.find((item) => item.menuId === id);
        if (isExist) {
          setAvailable(false);
        } else {
          setAvailable(true);
        }
      } else if (itemType === "menuCategory") {
        const isExistCat =
          disableLocationMenuCat &&
          disableLocationMenuCat.find((item) => item.menuCategoryId === id);
        if (isExistCat) {
          setAvailableMenuCat(false);
        } else {
          setAvailableMenuCat(true);
        }
      }
    };
    getDisableLocationMenu();
  }, [
    isUpdateLocation,
    disableLocationMenu,
    disableLocationMenuCat,
    id,
    itemType,
    promotion,
  ]);
  const handleSwitchChange = async (e: boolean) => {
    setAvailableIsLoading(true);
    if (itemType === "menu") {
      const { isSuccess, message } = await handleDisableLocationMenu({
        available: e,
        menuId: id,
      });
      if (isSuccess) {
        setAvailable(e);
      }
      addToast({
        title: message,
        color: isSuccess ? "success" : "danger",
      });
    } else if (itemType === "menuCategory") {
      const { isSuccess, message } = await handleDisableLocationMenuCat({
        available: e,
        menuCategoryId: id,
      });
      if (isSuccess) {
        setAvailableMenuCat(e);
      }
      addToast({
        title: message,
        color: isSuccess ? "success" : "danger",
      });
    }
    if (itemType === "promotion") {
      const { isSuccess, message } = await handleActivePromotion({ e, id });
      addToast({
        title: message,
        color: isSuccess ? "success" : "danger",
      });
      if (isSuccess) {
        setAvailable(e);
      }
    }
    setAvailableIsLoading(false);
  };
  return (
    <>
      <Dropdown className="bg-background min-w-12">
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="light"
            className="bg-background rounded-md bg-opacity-40 outline-none"
            size="sm"
          >
            <MenuDots className="size-5 rotate-90" strokeWidth={0.7} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded">
          <DropdownItem
            key="edit"
            endContent={<PenNewSquare className={iconClasses} />}
            onPress={() => {
              if (itemType === "menu" && onEditMenu && menu && menuCategoryMenu) {
                onEditMenu(id, menu, menuCategoryMenu);
              } else if (itemType === "menuCategory" && onEditMenuCategory) {
                onEditMenuCategory(id);
              } else if (itemType === "addon" && onEditAddon && addon) {
                onEditAddon(id, addon);
              } else if (itemType === "addonCategory" && onEditAddonCategory) {
                onEditAddonCategory(id);
              } else if (itemType === "table" && onEditTable) {
                onEditTable(id);
              } else if (itemType === "location" && onEditLocation) {
                onEditLocation(id);
              } else if (itemType === "menu") {
                setSelectedMenuForUpdate({
                  id,
                  menu,
                  menuCategoryMenu,
                });
                onUpdateOpen();
              } else {
                onUpdateOpen();
              }
            }}
            href={
              itemType === "activeOrder"
                ? `/order/${orderData?.menu?.id}?tableId=${tableId}&orderId=${orderData?.itemId}`
                : itemType === "promotion"
                  ? `/backoffice/promotion/${id}`
                  : ""
            }
          >
            Edit
          </DropdownItem>
          {availableIsLoading ? (
            <DropdownItem
              key="none"
              isReadOnly
              className="p-0"
              endContent={<Spinner variant="wave" />}
            >
              Loading...
            </DropdownItem>
          ) : itemType === "menu" ? (
            <DropdownItem
              key="available"
              isReadOnly
              endContent={
                <Switch
                  isSelected={available}
                  onValueChange={handleSwitchChange}
                  className="m-0"
                  size="sm"
                  aria-label="Available"
                />
              }
            >
              Available
            </DropdownItem>
          ) : itemType === "menuCategory" ? (
            <DropdownItem
              key="available"
              isReadOnly
              endContent={
                <Switch
                  isSelected={availableMenuCat}
                  onValueChange={handleSwitchChange}
                  className="m-0"
                  size="sm"
                  aria-label="Available"
                />
              }
            >
              Available
            </DropdownItem>
          ) : itemType === "table" ? (
            <DropdownItem
              closeOnSelect={false}
              key="printQrcode"
              textValue="printQrdcode"
            >
              <QrcodePrint table={table} qrCodeData={qrCodeData} />
            </DropdownItem>
          ) : itemType === "promotion" ? (
            <DropdownItem
              key="available"
              isReadOnly
              endContent={
                <Switch
                  isSelected={available}
                  onValueChange={handleSwitchChange}
                  className="m-0"
                  size="sm"
                  aria-label="Available"
                />
              }
            >
              Active
            </DropdownItem>
          ) : (
            <DropdownItem key="none" className="hidden">
              None
            </DropdownItem>
          )}
          {itemType === "addon" ? (
            <DropdownItem
              key="managePrice"
              endContent={<DollarSign className={iconClasses} />}
              onPress={onManagePriceOpen}
            >
              Manage Menu Prices
            </DropdownItem>
          ) : (
            <DropdownItem
              className="hidden"
              key="managePriceNone"
              isReadOnly={true}
            >
              none
            </DropdownItem>
          )}
          <DropdownItem
            key="delete"
            className={`text-danger ${isNotDeletable ? "hidden" : ""}`}
            color="danger"
            endContent={
              itemType === "activeOrder" ? (
                <MapPinOff className={cn(iconClasses, "text-danger")} />
              ) : (
                <TrashBinTrash className={cn(iconClasses, "text-danger")} />
              )
            }
            onPress={onDeleteOpen}
          >
            {itemType === "activeOrder" ? "Cancel" : "Delete"}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      {itemType === "menu" ? (
        <>
          {/* Only render dialog if onEditMenu is not provided (backward compatibility) */}
          {!onEditMenu && isUpdateOpen && selectedMenuForUpdate && (
            <UpdateMenuDialog
              key={selectedMenuForUpdate.id}
              id={selectedMenuForUpdate.id}
              menuCategory={categories}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={() => {
                setSelectedMenuForUpdate(null);
                onUpdateClose();
              }}
              menu={selectedMenuForUpdate.menu}
              menuCategoryMenu={selectedMenuForUpdate.menuCategoryMenu}
            />
          )}
          <DeleteMenuDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "menuCategory" ? (
        <>
          {/* Only render dialog if onEditMenuCategory is not provided (backward compatibility) */}
          {!onEditMenuCategory && (
            <UpdateMenuCategoryDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          )}
          <DeleteMenuCategoryDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "addonCategory" ? (
        <>
          {/* Only render dialog if onEditAddonCategory is not provided (backward compatibility) */}
          {!onEditAddonCategory && (
            <UpdateAddonCategoryDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
              menu={menus}
            />
          )}
          <DeleteAddonCategoryDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "addon" ? (
        <>
          {/* Only render dialog if onEditAddon is not provided (backward compatibility) */}
          {!onEditAddon && (
            <UpdateAddonDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
              addon={addon}
              addonCategory={addonCategory}
            />
          )}
          <DeleteAddonDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
          {addon && (
            <ManageMenuAddonPriceDialog
              addon={addon}
              isOpen={isManagePriceOpen}
              onOpenChange={onManagePriceOpenChange}
              onClose={onManagePriceClose}
            />
          )}
        </>
      ) : itemType === "location" ? (
        <>
          {/* Only render dialog if onEditLocation is not provided (backward compatibility) */}
          {!onEditLocation && (
            <UpdateLocationDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          )}
          <DeleteLocationDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "table" ? (
        <>
          {/* Only render dialog if onEditTable is not provided (backward compatibility) */}
          {!onEditTable && (
            <UpdateTableDialog
              id={id}
              isOpen={isUpdateOpen}
              onOpenChange={onUpdateOpenChange}
              onClose={onUpdateClose}
            />
          )}
          <DeleteTableDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "activeOrder" ? (
        <CancelOrderDialog
          id={orderData?.itemId}
          onClose={onDeleteClose}
          onOpenChange={onDeleteOpenChange}
          isOpen={isDeleteOpen}
        />
      ) : itemType === "promotion" ? (
        <>
          <DeletePromotionDailog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
          />
        </>
      ) : itemType === "warehouse" ? (
        <>
          <UpdateWarehouseDialog
            id={id}
            warehouse={warehouse}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteWarehouseDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
            warehouse={warehouse}
          />
        </>
      ) : itemType === "warehouseItem" ? (
        <>
          <UpdateWarehouseItemDialog
            id={id}
            warehouseItem={warehouseItem}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
          />
          <DeleteWarehouseItemDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
            warehouseItem={warehouseItem}
          />
        </>
      ) : itemType === "ingredient" ? (
        <EditMenuIngredient
          id={id}
          isOpen={isUpdateOpen}
          onOpenChange={onUpdateOpenChange}
          onClose={onUpdateClose}
          menu={menu}
          ingredients={ingredients}
          warehouseItems={warehouseItems}
        />
      ) : itemType === "supplier" ? (
        <>
          <UpdateSupplierDialog
            id={id}
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
            supplier={supplier}
          />
          <DeleteSupplierDialog
            id={id}
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
            supplier={supplier}
          />
        </>
      ) : itemType === "addonIngredient" ? (
        <>
          <UpdateAddonIngredientDialog
            isOpen={isUpdateOpen}
            onOpenChange={onUpdateOpenChange}
            onClose={onUpdateClose}
            addons={addons}
            menus={menus}
            warehouseItems={warehouseItems}
            addonIngredientData={addonIngredientData}
            addonIngredients={addonIngredients}
          />
          <DeleteAddonIngredientDialog
            onClose={onDeleteClose}
            onOpenChange={onDeleteOpenChange}
            isOpen={isDeleteOpen}
            menu={menu}
            addon={addon}
          />
        </>
      ) : null}
    </>
  );
}
