"use server";

import { AddonIngredientForm } from "@/components/NewAddonIngredient";
import { prisma } from "@/db";
import { logError } from "@/lib/logger";
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
  Unit,
  UnitCategory,
} from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  fetchAddonWithId,
  fetchCompany,
  fetchSelectedLocation,
  fetchUser,
} from "../backoffice/data";
import {
  fetchPOItemWithPOId,
  fetchPurchaseOrderWithId,
  fetchSelectedWarehouse,
  fetchSupplierWithId,
  fetchWarehouse,
} from "./data";
import { MenuItemIngredientForm } from "@/app/(secure)/warehouse/components/EditMenuIngredient";
import { POItemForm } from "@/app/(secure)/warehouse/components/NewPurchaseOrderForm";
import { checkWMS } from "@/function";

export async function createWarehouse(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { isSuccess: false, message: "Name is not provided!" };
  try {
    const selectedLocation = await fetchSelectedLocation();
    if (!selectedLocation) {
      return { isSuccess: false, message: "Something went wrong!" };
    }
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const warehouse = await prisma.warehouse.create({
      data: { name, locationId: selectedLocation?.locationId },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "CREATE_WAREHOUSE",
        targetType: "Warehouse",
        targetId: warehouse.id,
        changes: JSON.stringify({
          name,
          locationId: selectedLocation.locationId,
        }),
      },
    });

    revalidatePath("/warehouse/manage");
    return {
      message: "Created warehouse successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const originalWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    await prisma.warehouse.update({
      where: { id },
      data: { name },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "UPDATE_WAREHOUSE",
        targetType: "Warehouse",
        targetId: id,
        changes: JSON.stringify({
          name: { old: originalWarehouse?.name, new: name },
        }),
      },
    });

    revalidatePath("/warehouse/manage");
    return {
      message: "Updated warehouse successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const warehouse = await fetchWarehouse();
    if (warehouse && warehouse.length < 2) {
      return {
        message: "Keep warehouse least one",
        isSuccess: false,
      };
    }
    const originalWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });
    const selectedWarehouse = await fetchSelectedWarehouse();
    const isSelected = selectedWarehouse?.warehouseId === id;

    await prisma.warehouse.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "DELETE_WAREHOUSE",
        targetType: "Warehouse",
        targetId: id,
        changes: JSON.stringify({
          name: originalWarehouse?.name,
          isArchived: { old: false, new: true },
        }),
      },
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
    logError(error, { function: "createWarehouse" });
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
  const threshold = convertBaseUnit({
    amount: Number(data.threshold),
    fromUnit: unit,
  });
  const isValid =
    name && unitCategory && unit && threshold && typeof threshold === "number";
  if (!isValid)
    return {
      message: "Missing required fields.",
      isSuccess: false,
    };

  try {
    const { company, user } = await fetchCompany();
    if (!company || !user)
      return {
        message: "Something went wrong!",
        isSuccess: false,
      };
    const warehouseItem = await prisma.warehouseItem.create({
      data: { name, unitCategory, unit, threshold, companyId: company.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "CREATE_WAREHOUSE_ITEM",
        targetType: "Warehouse Item",
        targetId: warehouseItem.id,
        changes: JSON.stringify({ name, unitCategory, unit, threshold }),
      },
    });

    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Created warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
  const threshold = convertBaseUnit({
    amount: Number(data.threshold),
    fromUnit: unit,
  });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const originalItem = await prisma.warehouseItem.findUnique({
      where: { id },
    });

    await prisma.warehouseItem.update({
      where: { id },
      data: { name, unitCategory, unit, threshold },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "UPDATE_WAREHOUSE_ITEM",
        targetType: "Warehouse Item",
        targetId: id,
        changes: JSON.stringify({
          name: { old: originalItem?.name, new: name },
          unitCategory: { old: originalItem?.unitCategory, new: unitCategory },
          unit: { old: originalItem?.unit, new: unit },
          threshold: { old: originalItem?.threshold, new: threshold },
        }),
      },
    });

    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Updated warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const originalItem = await prisma.warehouseItem.findUnique({
      where: { id },
    });

    await prisma.warehouseItem.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "DELETE_WAREHOUSE_ITEM",
        targetType: "Warehouse Item",
        targetId: id,
        changes: JSON.stringify({
          name: originalItem?.name,
          isArchived: { old: false, new: true },
        }),
      },
    });

    revalidatePath("/warehouse/warehouse-item");
    return {
      message: "Deleted warehouse item successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
      errors.push("Ingredient quantity must be greater than 0.");
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
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user)
      return {
        message: "Something went wrong!",
        isSuccess: false,
      };
    const supplier = await prisma.supplier.create({
      data: { name, phone, email, address, companyId: company?.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "CREATE_SUPPLIER",
        targetType: "Supplier",
        targetId: supplier.id,
        changes: JSON.stringify({ name, phone, email, address }),
      },
    });

    revalidatePath("/warehouse/supplier");
    return {
      message: "Created supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const originalSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    await prisma.supplier.update({
      where: { id },
      data: { name, phone, email, address },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "UPDATE_SUPPLIER",
        targetType: "Supplier",
        targetId: id,
        changes: JSON.stringify({
          name: { old: originalSupplier?.name, new: name },
          phone: { old: originalSupplier?.phone, new: phone },
          email: { old: originalSupplier?.email, new: email },
          address: { old: originalSupplier?.address, new: address },
        }),
      },
    });

    revalidatePath("/warehouse/supplier");
    return {
      message: "Updated supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
    const { company, user } = await fetchCompany();
    if (!company || !user) {
      return {
        isSuccess: false,
        message: "Error occurred while fetching user!",
      };
    }
    const originalSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    await prisma.supplier.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: company.id,
        action: "DELETE_SUPPLIER",
        targetType: "Supplier",
        targetId: id,
        changes: JSON.stringify({
          name: originalSupplier?.name,
          isArchived: { old: false, new: true },
        }),
      },
    });

    revalidatePath("/warehouse/supplier");
    return {
      message: "Deleted supplier successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
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
      errors.push("Ingredient quantity must be greater than 0.");
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

  const addon = await fetchAddonWithId(addonId);
  if (addon && addon.needIngredient === false) {
    return { message: "This addon does not need ingredient", isSuccess: false };
  }

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
    logError(error, { function: "createWarehouse" });
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
      errors.push("Ingredient quantity must be greater than 0.");
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
    logError(error, { function: "createWarehouse" });
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
    logError(error, { function: "createWarehouse" });
    return {
      message: "Something went wrong while deleting addon ingredient!",
      isSuccess: false,
    };
  }
}

export async function createPurchaseOrder(formData: FormData) {
  // Input validation
  const { purchaseOrderSchema } = await import("@/lib/validation-schemas");

  const data = Object.fromEntries(formData);
  const supplierId = Number(data.supplier);
  const warehouseId = Number(data.warehouse);
  const poItems: POItemForm[] = JSON.parse(data.poItems as string);

  // Convert PO items to validation format
  const validationItems = poItems.map((item) => ({
    itemId: item.itemId,
    quantity: item.quantity || 0,
    unitPrice: item.price || 0,
    unit: item.unit || "",
  }));

  const validationResult = purchaseOrderSchema.safeParse({
    supplierId,
    warehouseId,
    items: validationItems,
  });

  if (!validationResult.success) {
    return {
      message: `Invalid input: ${validationResult.error.issues
        .map((e) => e.message)
        .join(", ")}`,
      isSuccess: false,
    };
  }
  const { company, user } = await fetchCompany();
  if (!user || !company)
    return { message: "Error occurred while fetching user!", isSuccess: false };
  try {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId: validationResult.data.supplierId,
        warehouseId: validationResult.data.warehouseId,
        code: nanoid(6),
        status: POStatus.PENDING,
      },
    });
    await prisma.$transaction(
      validationResult.data.items.map((item) => {
        // Find original item to get unit
        const originalItem = poItems.find((po) => po.itemId === item.itemId);
        const unit = originalItem?.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.quantity,
          fromUnit: unit,
        });
        const basePrice = convertUnit({
          amount: item.unitPrice,
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
        companyId: company.id,
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
    logError(error, { function: "createWarehouse" });
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
      errors.push("PO item quantity must be greater than 0.");
    }
    if (poItem.price && poItem.price <= 0) {
      errors.push("PO item price must be greater than 0.");
    }
    if (seenItems.has(poItem.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(poItem.itemId);
  }
  if (errors.length > 0) {
    return { message: errors.join("\n"), isSuccess: false };
  }
  const { company, user } = await fetchCompany();
  if (!user || !company)
    return { message: "Error occurred while fetching user!", isSuccess: false };
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
          companyId: company.id,
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
          companyId: company.id,
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
    logError(error, { function: "createWarehouse" });
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
  // Validation: Check if array is not empty
  if (!stockMovement || !stockMovement.length) {
    return {
      message: "Stock movement data is not provided!",
      isSuccess: false,
    };
  }

  // Validation: Validate each item in the array
  const errors: string[] = [];
  const itemIds = new Set<number>();
  const warehouseIds = new Set<number>();

  for (let i = 0; i < stockMovement.length; i++) {
    const item = stockMovement[i];
    const index = i + 1;

    // Validate itemId
    if (!item.itemId || item.itemId <= 0 || !Number.isInteger(item.itemId)) {
      errors.push(`Item ${index}: Invalid itemId. Must be a positive integer.`);
    } else {
      itemIds.add(item.itemId);
    }

    // Validate quantity
    if (
      !item.quantity ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity)
    ) {
      errors.push(
        `Item ${index}: Invalid quantity. Must be a positive integer.`
      );
    }

    // Validate warehouseId
    if (
      !item.warehouseId ||
      item.warehouseId <= 0 ||
      !Number.isInteger(item.warehouseId)
    ) {
      errors.push(
        `Item ${index}: Invalid warehouseId. Must be a positive integer.`
      );
    } else {
      warehouseIds.add(item.warehouseId);
    }

    // Validate type
    if (!item.type || !Object.values(MovementType).includes(item.type)) {
      errors.push(`Item ${index}: Invalid movement type. Must be IN or OUT.`);
    }

    // Validate source
    if (!item.source || !Object.values(MovementSource).includes(item.source)) {
      errors.push(
        `Item ${index}: Invalid movement source. Must be MANUAL, PURCHASE_ORDER, or CUSTOMER_ORDER.`
      );
    }

    // Validate parentId if provided
    if (item.parentId !== undefined && item.parentId !== null) {
      if (!Number.isInteger(item.parentId) || item.parentId <= 0) {
        errors.push(
          `Item ${index}: Invalid parentId. Must be a positive integer or null.`
        );
      }
    }
  }

  if (errors.length > 0) {
    return {
      message: `Validation errors:\n${errors.join("\n")}`,
      isSuccess: false,
    };
  }

  try {
    // Validation: Check if all items exist in database
    const existingItems = await prisma.warehouseItem.findMany({
      where: { id: { in: Array.from(itemIds) } },
      select: { id: true },
    });
    const existingItemIds = new Set(existingItems.map((item) => item.id));
    const missingItems = Array.from(itemIds).filter(
      (id) => !existingItemIds.has(id)
    );
    if (missingItems.length > 0) {
      return {
        message: `Invalid item IDs: ${missingItems.join(
          ", "
        )}. These items do not exist.`,
        isSuccess: false,
      };
    }

    // Validation: Check if all warehouses exist
    const existingWarehouses = await prisma.warehouse.findMany({
      where: { id: { in: Array.from(warehouseIds) } },
      select: { id: true },
    });
    const existingWarehouseIds = new Set(existingWarehouses.map((wh) => wh.id));
    const missingWarehouses = Array.from(warehouseIds).filter(
      (id) => !existingWarehouseIds.has(id)
    );
    if (missingWarehouses.length > 0) {
      return {
        message: `Invalid warehouse IDs: ${missingWarehouses.join(
          ", "
        )}. These warehouses do not exist.`,
        isSuccess: false,
      };
    }

    // Validation: Check if parentId exists (if provided)
    const parentIds = stockMovement
      .map((item) => item.parentId)
      .filter((id): id is number => id !== undefined && id !== null);
    if (parentIds.length > 0) {
      const existingParents = await prisma.stockMovement.findMany({
        where: { id: { in: parentIds } },
        select: { id: true },
      });
      const existingParentIds = new Set(existingParents.map((p) => p.id));
      const missingParents = parentIds.filter(
        (id) => !existingParentIds.has(id)
      );
      if (missingParents.length > 0) {
        return {
          message: `Invalid parent IDs: ${missingParents.join(
            ", "
          )}. These parent stock movements do not exist.`,
          isSuccess: false,
        };
      }
    }

    // Validation: Check stock availability for OUT movements
    // OUT movements require existing stock - cannot be the first movement
    const outMovements = stockMovement.filter(
      (item) => item.type === MovementType.OUT
    );
    if (outMovements.length > 0) {
      const stockChecks = await Promise.all(
        outMovements.map(async (item) => {
          const stock = await prisma.warehouseStock.findUnique({
            where: {
              itemId_warehouseId: {
                itemId: item.itemId,
                warehouseId: item.warehouseId,
              },
            },
            include: {
              warehouseItem: {
                select: { name: true },
              },
            },
          });
          return {
            item,
            stock: stock?.quantity ?? null,
            stockExists: stock !== null,
            itemName: stock?.warehouseItem.name ?? `Item #${item.itemId}`,
          };
        })
      );

      // Check if stock exists for OUT movements
      const missingStock = stockChecks.filter((check) => !check.stockExists);
      if (missingStock.length > 0) {
        const errorMessages = missingStock.map(
          (check) =>
            `${check.itemName}: Stock does not exist. OUT movements require existing stock. First movement must be IN.`
        );
        return {
          message: `Stock validation failed:\n${errorMessages.join("\n")}`,
          isSuccess: false,
        };
      }

      // Check if sufficient stock is available
      const insufficientStock = stockChecks.filter(
        (check) => check.stockExists && (check.stock ?? 0) < check.item.quantity
      );

      if (insufficientStock.length > 0) {
        const errorMessages = insufficientStock.map(
          (check) =>
            `${check.itemName}: Insufficient stock. Available: ${check.stock}, Required: ${check.item.quantity}`
        );
        return {
          message: `Stock validation failed:\n${errorMessages.join("\n")}`,
          isSuccess: false,
        };
      }
    }

    // All validations passed, proceed with transaction
    // Separate IN and OUT movements for different handling
    const inMovements = stockMovement.filter(
      (item) => item.type === MovementType.IN
    );
    const outMovementsForUpdate = stockMovement.filter(
      (item) => item.type === MovementType.OUT
    );

    await prisma.$transaction([
      // Create all stock movements
      prisma.stockMovement.createMany({ data: stockMovement }),
      // Handle IN movements - can create new stock entries
      ...inMovements.map((item) => {
        return prisma.warehouseStock.upsert({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: item.warehouseId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            warehouseId: item.warehouseId,
            itemId: item.itemId,
            quantity: item.quantity,
          },
        });
      }),
      // Handle OUT movements - stock must already exist (validated above)
      // First stock movement cannot be OUT - use update instead of upsert
      ...outMovementsForUpdate.map((item) => {
        return prisma.warehouseStock.update({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: item.warehouseId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }),
    ]);

    return {
      message: "Stock movement is finished successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "createStockMovement" });
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

    const { user, company } = await fetchCompany();
    if (!user || !company)
      return { message: "User data not found!", isSuccess: false };
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: "RECEIVED" },
    });
    const supplier = await fetchSupplierWithId(updatedPO.supplierId);
    await prisma.auditLog.create({
      data: {
        action: "RECEIVED_PO",
        userId: user.id,
        companyId: company.id,
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
    logError(error, { function: "createWarehouse" });
    return {
      message: "Something went wrong while receiving PO!",
      isSuccess: false,
    };
  }
}

export async function cancelPurchaseOrder(poId: number) {
  if (!poId)
    return {
      message: "PO id is not provided.",
      isSuccess: false,
    };

  try {
    const { company, user } = await fetchCompany();
    if (!user || !company)
      return {
        message: "Error occurred while fetching user!",
        isSuccess: false,
      };

    // Check if PO exists and its status
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!purchaseOrder) {
      return {
        message: "Purchase order not found.",
        isSuccess: false,
      };
    }

    // Prevent cancelling already received or cancelled POs
    if (purchaseOrder.status === POStatus.RECEIVED) {
      return {
        message: "Cannot cancel a received purchase order.",
        isSuccess: false,
      };
    }

    if (purchaseOrder.status === POStatus.CANCELLED) {
      return {
        message: "Purchase order is already cancelled.",
        isSuccess: false,
      };
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: POStatus.CANCELLED },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CANCEL_PO",
        userId: user.id,
        companyId: company.id,
        targetType: "Purchase Order",
        targetId: poId,
        changes: JSON.stringify({
          code: purchaseOrder.code,
          previousStatus: purchaseOrder.status,
          newStatus: POStatus.CANCELLED,
        }),
      },
    });

    revalidatePath("/warehouse/purchase-order");
    return { message: "Canceled PO Successfully.", isSuccess: true };
  } catch (error) {
    logError(error, { function: "createWarehouse" });
    return {
      message: "Something went wrong while canceling PO!",
      isSuccess: false,
    };
  }
}

export async function correctPurchaseOrder(formData: FormData) {
  const data = Object.fromEntries(formData);
  const id = Number(data.id);
  const poItems = JSON.parse(data.poItems as string) as POItemForm[];
  const errors: string[] = [];
  const seenItems = new Set<number>();
  if (!id) return { message: "Id is not provided!", isSuccess: false };

  //poitem validation
  for (const poItem of poItems) {
    if (!poItem.unit || poItem.unit === "") {
      errors.push("Each PO item must have a unit.");
    }
    if (poItem.quantity && poItem.quantity <= 0) {
      errors.push("PO item quantity must be greater than 0.");
    }
    if (poItem.price && poItem.price <= 0) {
      errors.push("PO item price must be greater than 0.");
    }
    if (seenItems.has(poItem.itemId)) {
      errors.push("Duplicate items are not allowed.");
    }
    seenItems.add(poItem.itemId);
  }
  if (errors.length > 0) {
    return { message: errors.join("\n"), isSuccess: false };
  }
  const { company, user } = await fetchCompany();
  if (!user || !company)
    return {
      message: "Error occurred while fetching user ad company!",
      isSuccess: false,
    };

  try {
    const originalPOData = await fetchPurchaseOrderWithId(id);

    if (!originalPOData)
      return {
        message: "Could not find purchase order items.",
        isSuccess: false,
      };
    //prevent correction pending and cancelled po
    if (originalPOData.status !== POStatus.RECEIVED)
      return {
        message: "Cannot correct non-received purchase order!",
        isSuccess: false,
      };

    const originalPOItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });
    if (!originalPOItems)
      return { message: "Cannot find PO items", isSuccess: false };

    // check po item difference
    const poItemDataDiff = getPOItemDataDiff(originalPOItems, poItems);

    if (poItemDataDiff) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { isEdited: true },
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
          return prisma.purchaseOrderItem.update({
            where: {
              itemId_purchaseOrderId: {
                itemId: item.itemId,
                purchaseOrderId: id,
              },
            },
            data: { quantity: baseQuantity, unitPrice: basePrice },
          });
        })
      );
      // item transfer
      const stockOutMovement = originalPOItems.map((item) => {
        return {
          itemId: item.itemId,
          type: MovementType.OUT,
          quantity: item.quantity || 0,
          warehouseId: originalPOData.warehouseId,
          source: MovementSource.PURCHASE_ORDER,
          reference: `PO-${originalPOData.code}`,
          note: `Correction of ${originalPOData.code}`,
          parentId: originalPOData.id,
        };
      });
      await createStockMovement(stockOutMovement);
      const stockInMovement = poItems.map((item) => {
        const unit = item.unit?.toUpperCase() as Unit;
        const baseQuantity = convertBaseUnit({
          amount: item.quantity as number,
          fromUnit: unit,
        });
        return {
          itemId: item.itemId,
          type: MovementType.IN,
          quantity: baseQuantity,
          warehouseId: originalPOData.warehouseId,
          source: MovementSource.PURCHASE_ORDER,
          reference: `PO-${originalPOData.code}`,
          note: `Correction of ${originalPOData.code}`,
          parentId: originalPOData.id,
        };
      });
      await createStockMovement(stockInMovement);
      // audit correction
      await prisma.auditLog.create({
        data: {
          companyId: company?.id,
          userId: user.id,
          action: "CORRECT_PO",
          targetType: "PurchaseOrderItem",
          targetId: id,
          changes: poItemDataDiff,
        },
      });
      revalidatePath("/warehouse/purchase-order");
      return {
        message: "Corrected PO items Successfully.",
        isSuccess: true,
      };
    } else {
      return { message: "Didn't find any changes", isSuccess: false };
    }
  } catch (error) {
    logError(error, { function: "createWarehouse" });
    return {
      message: "Something went wrong while correcting the PO!",
      isSuccess: false,
    };
  }
}

export async function deletePurchaseOrder(poId: number) {
  if (!poId)
    return {
      message: "PO id is not provided.",
      isSuccess: false,
    };

  try {
    const { company, user } = await fetchCompany();
    if (!user || !company)
      return {
        message: "Error occurred while fetching user!",
        isSuccess: false,
      };

    // Check if PO exists and get its status
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        PurchaseOrderItem: true,
      },
    });

    if (!purchaseOrder) {
      return {
        message: "Purchase order not found.",
        isSuccess: false,
      };
    }

    // Prevent deleting received POs (they've already affected stock)
    if (purchaseOrder.status === POStatus.RECEIVED) {
      return {
        message:
          "Cannot delete a received purchase order. Stock has already been updated.",
        isSuccess: false,
      };
    }

    // Prevent deleting cancelled POs (for audit trail)
    if (purchaseOrder.status === POStatus.CANCELLED) {
      return {
        message: "Cannot delete a cancelled purchase order.",
        isSuccess: false,
      };
    }

    // Delete purchase order items first (cascade delete)
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: poId },
    });

    // Delete purchase order history
    await prisma.purchaseOrderHistory.deleteMany({
      where: { purchaseOrderId: poId },
    });

    await prisma.purchaseOrderItemHistory.deleteMany({
      where: { purchaseOrderId: poId },
    });

    // Delete the purchase order
    await prisma.purchaseOrder.delete({
      where: { id: poId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE_PO",
        userId: user.id,
        companyId: company.id,
        targetType: "Purchase Order",
        targetId: poId,
        changes: JSON.stringify({
          code: purchaseOrder.code,
          status: purchaseOrder.status,
          itemsCount: purchaseOrder.PurchaseOrderItem.length,
        }),
      },
    });

    revalidatePath("/warehouse/purchase-order");
    return {
      message: "Purchase order deleted successfully.",
      isSuccess: true,
    };
  } catch (error) {
    logError(error, { function: "deletePurchaseOrder" });
    return {
      message: "Something went wrong while deleting the purchase order!",
      isSuccess: false,
    };
  }
}

export async function checkWMSAction() {
  try {
    const result = await checkWMS();
    return { isSuccess: true, data: result };
  } catch (error) {
    logError(error, { function: "checkWMS" });
    return {
      isSuccess: false,
      message: "Failed to check warehouse management system.",
      data: null,
    };
  }
}
