import * as yup from "yup";

const purchaseReturnItemSchema = yup.object().shape({
    product: yup.string().required("Product is required"),
    batch: yup.string().required("Batch is required"),
    batchNumber: yup.string().required("Batch number is required"),
    quantity: yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
    purchasePrice: yup.number().required("Purchase price is required").min(0, "Purchase price must be non-negative"),
    returnReason: yup.string().required("Return reason is required").oneOf(["damaged", "expired", "wrong_item", "excess", "quality_issue", "other"]),
    notes: yup.string().optional()
});

export const createPurchaseReturnSchema = yup.object().shape({
    purchase: yup.string().required("Purchase is required"),
    supplier: yup.string().required("Supplier is required"),
    returnDate: yup.date().optional(),
    items: yup.array().of(purchaseReturnItemSchema).min(1, "At least one item is required").required("Items are required"),
    notes: yup.string().optional()
});

export const updatePurchaseReturnSchema = yup.object().shape({
    purchase: yup.string().optional(),
    supplier: yup.string().optional(),
    returnDate: yup.date().optional(),
    items: yup.array().of(purchaseReturnItemSchema).min(1, "At least one item is required").optional(),
    notes: yup.string().optional()
});

export const approvePurchaseReturnSchema = yup.object().shape({
    approved: yup.boolean().required("Approval status is required")
});
