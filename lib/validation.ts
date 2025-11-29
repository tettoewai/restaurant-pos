import { z } from "zod";

// Common validation schemas
export const idSchema = z.number().int().positive();
export const stringIdSchema = z.string().min(1);

export const tableIdSchema = idSchema;
export const menuIdSchema = idSchema;
export const locationIdSchema = idSchema;
export const warehouseIdSchema = idSchema;

// Order validation
export const cartItemSchema = z.object({
  id: z.string().min(1),
  menuId: idSchema,
  quantity: z.number().int().positive().max(100),
  addons: z.array(idSchema).default([]),
  instruction: z.string().max(500).optional(),
  isFoc: z.boolean().default(false),
  subTotal: z.number().int().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  tableId: idSchema,
  cartItem: z.array(cartItemSchema).min(1),
});

// Location validation
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Sanitize string inputs
export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ""); // Remove potential HTML tags
}

// Validate and sanitize form data
export function sanitizeFormData(formData: FormData): Record<string, string> {
  const data: Record<string, string> = {};
  // Convert FormData to array to avoid iterator issues
  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      data[key] = sanitizeString(value);
    }
  }
  return data;
}

// File upload validation
export const fileUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024), // 5MB max
  type: z
    .string()
    .refine((type) => type.startsWith("image/"), "File must be an image"),
});
