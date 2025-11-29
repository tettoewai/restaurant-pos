import { z } from "zod";
import { idSchema, cartItemSchema, createOrderSchema } from "./validation";

// Company validation
export const companySchema = z.object({
  name: z.string().min(1).max(200),
  street: z.string().min(1).max(200),
  township: z.string().min(1).max(200),
  city: z.string().min(1).max(200),
  taxRate: z.number().int().min(0).max(100),
});

// Menu validation
export const menuSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  description: z.string().max(1000).optional(),
});

// Location validation
export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  street: z.string().min(1).max(200),
  township: z.string().min(1).max(200),
  city: z.string().min(1).max(200),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

// Table validation
export const tableSchema = z.object({
  name: z.string().min(1).max(100),
  locationId: idSchema,
});

// Warehouse validation
export const warehouseSchema = z.object({
  name: z.string().min(1).max(200),
  locationId: idSchema,
});

// Warehouse item validation
export const warehouseItemSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.enum([
    "G",
    "KG",
    "ML",
    "L",
    "VISS",
    "LB",
    "OZ",
    "GAL",
    "DOZ",
    "UNIT",
  ]),
  unitCategory: z.enum(["MASS", "VOLUME", "COUNT"]),
  threshold: z.number().min(0),
});

// Supplier validation
export const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  address: z.string().max(500).optional(),
});

// Purchase order validation
export const purchaseOrderItemSchema = z.object({
  itemId: idSchema,
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  unit: z.string().min(1),
});

export const purchaseOrderSchema = z.object({
  supplierId: idSchema,
  warehouseId: idSchema,
  items: z.array(purchaseOrderItemSchema).min(1),
});

// Promotion validation
export const promotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  discount_value: z.number().int().min(0).optional(),
  totalPrice: z.number().int().min(0).optional(),
  start_date: z.string(), // Accept ISO string or date string
  end_date: z.string(), // Accept ISO string or date string
  locationId: idSchema,
  priority: z.number().int().min(1).max(100),
});

// Re-export commonly used schemas
export { createOrderSchema, cartItemSchema, idSchema };
