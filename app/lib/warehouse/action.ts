"use server";

import { MenuItemIngredientForm } from "@/app/warehouse/components/EditMenuIngredient";
import { POItemForm } from "@/app/warehouse/purchase-order/new/page";
import { AddonIngredientForm } from "@/components/NewAddonIngredient";
import { prisma } from "@/db";
import {
  convertBaseUnit,
  convertUnit,
  getPODataDiff,
  getPOItemDataDiff,
} from "@/function";
import {
  MovementSource,
  MovementType,
  POStatus,
  PurchaseOrderItem,
  StockMovement,
  Unit,
  UnitCategory,
} from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  fetchCompany,
  fetchSelectedLocation,
  fetchUser,
} from "../backoffice/data";
import {
  fetchPOItemWithPOId,
  fetchSelectedWarehouse,
  fetchSupplierWithId,
  fetchWarehouse,
} from "./data";

export async function createWarehouse(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { isSuccess: false, message: "Name is not provided!" };
  try {
    const selectedLocation = await fetchSelectedLocation();
    if (!selectedLocation) {
      return { isSuccess: false, message: "Something went wrong!" };
    }
    await prisma.warehouse.create({
      data: { name, locationId: selectedLocation?.locationId },
    });
    revalidatePath("/warehouse/manage");
    return {
      message: "Created warehouse successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating warehouse!",
      isSuccess: false,
    };
  }
}

export async function updateWarehouse(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  if (!name && !id)
    return { isSuccess: false, message: "Name is not provided!" };
  try {
    await prisma.warehouse.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/warehouse/manage");
    return {
      message: "Updated warehouse successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating warehouse!",
      isSuccess: false,
    };
  }
}

export async function updateSelectWarehouse(id: number) {
  if (!id)
    return {
      message: "Id is not privided!",
      isSuccess: false,
    };
  try {
    const user = await fetchUser();
    if (user) {
      await prisma.selectedWarehouse.deleteMany({ where: { userId: user.id } });
      const warehouse = await prisma.selectedWarehouse.create({
        data: { userId: user.id, warehouseId: id },
      });
      revalidatePath("/warehouse");
      return {
        warehouseId: warehouse.id,
        message: "Warehouse selection is updated successfully.",
        isSuccess: true,
      };
    } else
      return {
        message: "User not found!",
        isSuccess: false,
      };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating warehouse!",
      isSuccess: false,
    };
  }
}

export async function deleteWarehouse(id: number) {
  if (!id)
    return {
      message: "Id is not privided!",
      isSuccess: false,
    };
  try {
    const warehouse = await fetchWarehouse();
    if (warehouse && warehouse.length < 2) {
      return {
        message: "Keep warehouse least one",
        isSuccess: false,
      };
    }
    const selectedWarehouse = await fetchSelectedWarehouse();
    const isSelected = selectedWarehouse?.warehouseId === id;

    await prisma.warehouse.update({
      where: { id },
      data: { isArchived: true },
    });
    if (isSelected && warehouse) {
      const updatedWarehouse = await fetchWarehouse();
      if (updatedWarehouse) {
        const firstWarehouseId = updatedWarehouse[0].id;
        await updateSelectWarehouse(firstWarehouseId);
      }
    }
    revalidatePath("/warehouse/manage");
    return {
      message: "Deleted warehouse successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting warehouse!",
      isSuccess: false,
    };
  }
}

export async function createWarehouseItem(formData: FormData) {
  const data = Object.fromEntries(formData);
  const name = data.name as string;
  const unitCategory = (
    data.unitCategory as string
  ).toUpperCase() as UnitCategory;
  const unit = (data.unit as string).toUpperCase() as Unit;
  const threshold = Number(data.threshold);
  const isValid =
    name && unitCategory && unit && threshold && typeof threshold === "number";
  if (!isValid)
    return {
      message: "Missing required fields.",
      isSuccess: false,
    };

  try {
    const company = await fetchCompany();
    if (!company)
      return {
        message: "Something went wrong!",
        isSuccess: false,
      };
    await prisma.warehouseItem.create({
      data: { name, unitCategory, unit, threshold, companyId: company.id },
    });
    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Created warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating warehouse item!",
      isSuccess: false,
    };
  }
}

export async function updateWarehouseItem(formData: FormData) {
  const data = Object.fromEntries(formData);
  const id = Number(data.id);
  const name = data.name as string;
  const unitCategory = (
    data.unitCategory as string
  ).toUpperCase() as UnitCategory;
  const unit = (data.unit as string).toUpperCase() as Unit;
  const threshold = Number(data.threshold);
  const isValid =
    id &&
    name &&
    unitCategory &&
    unit &&
    threshold &&
    typeof threshold === "number";
  if (!isValid)
    return {
      message: "Missing required fields.",
      isSuccess: false,
    };

  try {
    await prisma.warehouseItem.update({
      where: { id },
      data: { name, unitCategory, unit, threshold },
    });
    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Updated warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating warehouse item!",
      isSuccess: false,
    };
  }
}

export async function deleteWarehouseItem(id: number) {
  if (!id)
    return {
      message: "Id is not privided!",
      isSuccess: false,
    };
  try {
    await prisma.warehouseItem.update({
      where: { id },
      data: { isArchived: true },
    });
    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Deleted warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting warehouse!",
      isSuccess: false,
    };
  }
}

export async function editMenuItemIngredient(
  formData: MenuItemIngredientForm[]
) {
  const errors: string[] = [];
  const seenItems = new Set<number>();

  const isValid = formData && formData.length && formData[0].menuId;
  if (!isValid)
    return { message: "Missing required fields!", isSuccess: false };
  for (const ingredient of formData) {
    if (!ingredient.itemId || ingredient.itemId === 0) {
      errors.push("Each ingredient must have an item selected.");
    }
    if (!ingredient.unit || ingredient.unit === "") {
      errors.push("Each ingredient must have a unit.");
    }
    if (ingredient.quantity <= 0) {
      errors.push("Ingredient qauantity must be grater than 0.");
    }
    if (seenItems.has(ingredient.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(ingredient.itemId);
  }
  if (errors.length > 0) {
    return {
      message: errors.join("\n"),
      isSuccess: false,
    };
  }
  try {
    await prisma.menuItemIngredient.deleteMany({
      where: { menuId: formData[0].menuId },
    });
    await prisma.$transaction(
      formData.map((item) => {
        const unit = item.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.quantity,
          fromUnit: unit,
        });
        return prisma.menuItemIngredient.create({
          data: {
            itemId: item.itemId,
            quantity: baseQuantity,
            menuId: item.menuId,
          },
        });
      })
    );
    revalidatePath("/warehouse/item-ingredient");
    return {
      message: "Edited ingredients successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while editing ingredients!",
      isSuccess: false,
    };
  }
}

export async function createSupplier(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phoneNo") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  if (!name)
    return {
      message: "Name is not provided.",
      isSuccess: false,
    };
  try {
    const company = await fetchCompany();
    if (!company)
      return {
        message: "Something went wrong!",
        isSuccess: false,
      };
    await prisma.supplier.create({
      data: { name, phone, email, address, companyId: company?.id },
    });
    revalidatePath("/warehouse/supplier");
    return {
      message: "Created supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating supplier!",
      isSuccess: false,
    };
  }
}

export async function updateSupplier(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const phone = formData.get("phoneNo") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  if (!name || !id)
    return {
      message: "Missing required fields.",
      isSuccess: false,
    };
  try {
    await prisma.supplier.update({
      where: { id },
      data: { name, phone, email, address },
    });
    revalidatePath("/warehouse/supplier");
    return {
      message: "Updated supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating supplier!",
      isSuccess: false,
    };
  }
}

export async function deleteSupplier(id: number) {
  if (!id)
    return {
      message: "Id is not provided.",
      isSuccess: false,
    };
  try {
    await prisma.supplier.update({
      where: { id },
      data: { isArchived: true },
    });
    revalidatePath("/warehouse/supplier");
    return {
      message: "Deleted supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting supplier!",
      isSuccess: false,
    };
  }
}

export async function createAddonIngredient(formData: FormData) {
  const data = Object.fromEntries(formData);
  const addonId = Number(data.addon);
  const menuId = Number(data.menu);
  const ingredientItem: AddonIngredientForm[] = JSON.parse(
    data.addonIngredient as string
  );

  const errors: string[] = [];
  const seenItems = new Set<number>();

  for (const ingredient of ingredientItem) {
    if (!ingredient.itemId || ingredient.itemId === 0) {
      errors.push("Each ingredient must have an item selected.");
    }
    if (!ingredient.unit || ingredient.unit === "") {
      errors.push("Each ingredient must have a unit.");
    }
    if (ingredient.extraQty <= 0) {
      errors.push("Ingredient qauantity must be grater than 0.");
    }
    if (seenItems.has(ingredient.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(ingredient.itemId);
  }
  if (errors.length > 0) {
    return {
      message: errors.join("\n"),
      isSuccess: false,
    };
  }
  if (!addonId)
    return { message: "Missing required fields!", isSuccess: false };

  const sameAddon = await prisma.addonIngredient.findFirst({
    where: { addonId },
  });

  const sameMenu =
    sameAddon && sameAddon.menuId ? sameAddon.menuId === menuId : menuId;

  const duplicateData = Boolean(sameAddon && sameMenu);

  if (duplicateData)
    return { message: "Duplicate data are not allowed!", isSuccess: false };

  try {
    await prisma.$transaction(
      ingredientItem.map((item) => {
        const unit = item.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.extraQty,
          fromUnit: unit,
        });
        return prisma.addonIngredient.create({
          data: {
            menuId,
            addonId,
            itemId: item.itemId,
            extraQty: baseQuantity,
          },
        });
      })
    );
    revalidatePath("/warehouse/addon-ingredient");
    return {
      message: "Created addon ingredient successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating addon ingredient!",
      isSuccess: false,
    };
  }
}

export async function updateAddonIngredient(formData: FormData) {
  const data = Object.fromEntries(formData);
  const addonId = Number(data.addon);
  const menuId = Number(data.menu) || 0;

  const ingredientItem: AddonIngredientForm[] = JSON.parse(
    data.addonIngredient as string
  );

  const errors: string[] = [];
  const seenItems = new Set<number>();

  for (const ingredient of ingredientItem) {
    if (!ingredient.itemId || ingredient.itemId === 0) {
      errors.push("Each ingredient must have an item selected.");
    }
    if (!ingredient.unit || ingredient.unit === "") {
      errors.push("Each ingredient must have a unit.");
    }
    if (ingredient.extraQty <= 0) {
      errors.push("Ingredient qauantity must be grater than 0.");
    }
    if (seenItems.has(ingredient.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(ingredient.itemId);
  }
  if (errors.length > 0) {
    return {
      message: errors.join("\n"),
      isSuccess: false,
    };
  }
  if (!addonId)
    return { message: "Missing required fields!", isSuccess: false };

  try {
    await prisma.addonIngredient.deleteMany({ where: { menuId, addonId } });
    await prisma.$transaction(
      ingredientItem.map((item) => {
        const unit = item.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.extraQty,
          fromUnit: unit,
        });
        return prisma.addonIngredient.create({
          data: {
            menuId,
            addonId,
            itemId: item.itemId,
            extraQty: baseQuantity,
          },
        });
      })
    );
    revalidatePath("/warehouse/addon-ingredient");
    return {
      message: "Updated addon ingredient successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating addon ingredient!",
      isSuccess: false,
    };
  }
}

export async function deleteAddonIngredient({
  menuId,
  addonId,
}: {
  menuId: number;
  addonId: number;
}) {
  if (!addonId)
    return {
      message: "Add-on id is not provided!",
      isSuccess: false,
    };
  try {
    await prisma.addonIngredient.deleteMany({
      where: { addonId, menuId: menuId || 0 },
    });
    revalidatePath("/warehouse/addon-ingredient");
    return {
      message: "Deleted addon ingredient successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while deleting addon ingredient!",
      isSuccess: false,
    };
  }
}

export async function createPurchaseOrder(formData: FormData) {
  const data = Object.fromEntries(formData);
  const supplierId = Number(data.supplier);
  const warehouseId = Number(data.warehouse);
  const idIsValid =
    supplierId &&
    typeof supplierId === "number" &&
    warehouseId &&
    typeof warehouseId === "number";
  if (!idIsValid)
    return {
      message: "Missing supplier id or warehouse id!",
      isSuccess: false,
    };
  const poItems: POItemForm[] = JSON.parse(data.poItems as string);
  const errors: string[] = [];
  const seenItems = new Set<number>();
  for (const poItem of poItems) {
    if (!poItem.itemId || poItem.itemId === 0) {
      errors.push("Each PO item must have an item selected.");
    }
    if (!poItem.unit || poItem.unit === "") {
      errors.push("Each PO item must have a unit.");
    }
    if (poItem.quantity && poItem.quantity <= 0) {
      errors.push("PO item qauantity must be grater than 0.");
    }
    if (poItem.price && poItem.price <= 0) {
      errors.push("PO item price must be grater than 0.");
    }
    if (seenItems.has(poItem.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(poItem.itemId);
  }
  if (errors.length > 0) {
    return { message: errors.join("\n"), isSuccess: false };
  }
  const user = await fetchUser();
  if (!user)
    return { message: "Find error while getting user!", isSuccess: false };
  try {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        warehouseId,
        code: nanoid(6),
        status: POStatus.PENDING,
      },
    });
    await prisma.$transaction(
      poItems.map((item) => {
        const unit = item.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.quantity as number,
          fromUnit: unit,
        });
        const basePrice = convertUnit({
          amount: item.price || 0,
          toUnit: unit,
        });
        return prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            itemId: item.itemId,
            quantity: baseQuantity,
            unitPrice: basePrice,
          },
        });
      })
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "Create PO",
        targetType: "Purchase Order",
        targetId: purchaseOrder.id,
      },
    });
    revalidatePath("/warehouse/purchase-order");
    return {
      message: "Created purchase order successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while creating purchase order!",
      isSuccess: false,
    };
  }
}

export async function updatePurchaseOrder(formData: FormData) {
  const data = Object.fromEntries(formData);
  const id = Number(data.id);
  const supplierId = Number(data.supplier);
  const warehouseId = Number(data.warehouse);
  const poItems = JSON.parse(data.poItems as string) as POItemForm[];
  const errors: string[] = [];
  const seenItems = new Set<number>();
  const isValid =
    supplierId &&
    typeof supplierId === "number" &&
    warehouseId &&
    typeof warehouseId === "number";
  if (!id) return { message: "Id is not provided!", isSuccess: false };
  if (!isValid)
    return {
      message: "Missing supplier id or warehouse id!",
      isSuccess: false,
    };
  for (const poItem of poItems) {
    if (!poItem.itemId || poItem.itemId === 0) {
      errors.push("Each PO item must have an item selected.");
    }
    if (!poItem.unit || poItem.unit === "") {
      errors.push("Each PO item must have a unit.");
    }
    if (poItem.quantity && poItem.quantity <= 0) {
      errors.push("PO item qauantity must be grater than 0.");
    }
    if (poItem.price && poItem.price <= 0) {
      errors.push("PO item price must be grater than 0.");
    }
    if (seenItems.has(poItem.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(poItem.itemId);
  }
  if (errors.length > 0) {
    return { message: errors.join("\n"), isSuccess: false };
  }
  const user = await fetchUser();
  if (!user)
    return { message: "Find error while getting user!", isSuccess: false };
  try {
    const originalPOData = await prisma.purchaseOrder.findFirst({
      where: { id },
    });
    if (
      originalPOData?.status === "RECEIVED" ||
      originalPOData?.status === "CANCELLED"
    ) {
      return {
        message: "Cannot edit a received or canceled purchase order.",
        isSuccess: false,
      };
    }
    const originalPOItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });
    if (!originalPOData)
      return { message: "Cannot find original data!", isSuccess: false };
    const poDataDiff = getPODataDiff(originalPOData, {
      warehouseId,
      supplierId,
    });

    const poItemDataDiff = getPOItemDataDiff(originalPOItems, poItems);

    if (poDataDiff) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { supplierId, warehouseId, isEdited: true },
      });
      // for audit
      await prisma.auditLog.create({
        data: {
          action: "POUpdate",
          userId: user.id,
          targetType: "Purchase Order",
          targetId: id,
          changes: JSON.stringify(poDataDiff),
        },
      });
      // for history
      await prisma.purchaseOrderHistory.create({
        data: {
          purchaseOrderId: id,
          snapshot: originalPOData,
          updatedById: user.id,
        },
      });
    }
    if (poItemDataDiff) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });
      await prisma.$transaction(
        poItems.map((item) => {
          const baseQuantity = convertBaseUnit({
            amount: item.quantity || 0,
            fromUnit: item.unit.toUpperCase() as Unit,
          });
          const basePrice = convertUnit({
            amount: item.price || 0,
            toUnit: item.unit.toUpperCase() as Unit,
          });
          return prisma.purchaseOrderItem.create({
            data: {
              purchaseOrderId: id,
              itemId: item.itemId,
              unitPrice: basePrice,
              quantity: baseQuantity,
            },
          });
        })
      );
      await prisma.auditLog.create({
        data: {
          action: "POItemUpdate",
          userId: user.id,
          targetType: "Purchase Order Item",
          targetId: id,
          changes: JSON.stringify(poItemDataDiff),
        },
      });
      await prisma.purchaseOrderItemHistory.create({
        data: {
          purchaseOrderId: id,
          snapshot: originalPOItems,
          updatedById: user.id,
        },
      });
    }

    revalidatePath("/warehouse/purchase-order");
    return {
      message: "Update purchase order successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while updating purchase order!",
      isSuccess: false,
    };
  }
}

export async function createStockMovement(
  stockMovement: {
    itemId: number;
    type: MovementType;
    quantity: number;
    warehouseId: number;
    source: MovementSource;
    reference?: string;
    note?: string;
    parentId?: number;
  }[]
) {
  if (!stockMovement.length)
    return {
      message: "PO item is not provided!",
      isSuccess: false,
    };

  try {
    await prisma.stockMovement.createMany({ data: stockMovement });
    await prisma.$transaction(
      stockMovement.map((item) => {
        const quantity =
          item.type === MovementType.OUT ? -item.quantity : item.quantity;
        return prisma.warehouseStock.upsert({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: item.warehouseId,
            },
          },
          update: { quantity: { increment: quantity } },
          create: {
            warehouseId: item.warehouseId,
            itemId: item.itemId,
            quantity: item.quantity,
          },
        });
      })
    );
    return {
      message: "Stock movement is finished successfully.",
      isSuccess: true,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while making stock movement!",
      isSuccess: false,
    };
  }
}

export async function receivePurchaseOrder(poId: number) {
  if (!poId) return { message: "PO Id is not provided!", isSuccess: false };
  try {
    const receivedPOItems = await fetchPOItemWithPOId(poId);

    const user = await fetchUser();
    if (!user) return { message: "User data not found!", isSuccess: false };
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: "RECEIVED" },
    });
    const supplier = await fetchSupplierWithId(updatedPO.supplierId);
    await prisma.auditLog.create({
      data: {
        action: "receive PO",
        userId: user.id,
        targetType: "Purchase Order",
        targetId: poId,
      },
    });

    const stockMovement = receivedPOItems.map((item) => {
      return {
        itemId: item.itemId,
        type: MovementType.IN,
        quantity: item.quantity,
        warehouseId: updatedPO.warehouseId,
        source: MovementSource.PURCHASE_ORDER,
        reference: `PO-${updatedPO.code}`,
        note: `Product from ${supplier?.name}`,
      };
    });

    await createStockMovement(stockMovement);
    revalidatePath("/warehouse/purchase-order");
    return { message: "Received PO Successfully.", isSuccess: true };
  } catch (error) {
    console.log(error);
    return {
      message: "Something went wrong while receiving PO!",
      isSuccess: false,
    };
  }
}
