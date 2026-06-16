// wastage.schema.js
import * as Yup from "yup";

// ─── ITEM SUB-SCHEMA ─────────────────────────────────────────────────────────
const wastageItemSchema = Yup.object({
    product: Yup.string().required("Product is required"),
    batchNumber: Yup.string().optional(),
    expiryDate: Yup.date().optional().nullable(),
    quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
    unit: Yup.string().optional(),
    costPrice: Yup.number().optional().min(0, "Cost price cannot be negative"),
});

// ─── CREATE SCHEMA ───────────────────────────────────────────────────────────
export const createWastageSchema = Yup.object({
    wastageDate: Yup.date().optional().default(() => new Date()),
    branch: Yup.string().optional(),
    reason: Yup.string(),
    notes: Yup.string().when("reason", {
        is: "other",
        then: (schema) => schema.required("Notes are required when reason is 'other'"),
        otherwise: (schema) => schema.optional(),
    }),
    items: Yup.array()
        .of(wastageItemSchema)
        .required("Items are required")
        .min(1, "At least one item is required"),
});

// ─── UPDATE SCHEMA ───────────────────────────────────────────────────────────
export const updateWastageSchema = Yup.object({
    wastageDate: Yup.date().optional(),
    branch: Yup.string().optional(),
    reason: Yup.string()
        .optional(),
    notes: Yup.string().optional(),
    items: Yup.array().of(wastageItemSchema).optional().min(1, "At least one item is required"),
});