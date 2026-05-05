import * as Yup from "yup";

const returnItemSchema = Yup.object({
    product: Yup.string().required("Product is required"),
    invoiceItem: Yup.string().optional().nullable(),
    batch: Yup.string().optional().nullable(),
    expiryDate: Yup.date().optional().nullable(),
    originalQty: Yup.number().optional().nullable(),
    returnQuantity: Yup.number().required("Return quantity is required").min(1, "Must be at least 1"),
    condition: Yup.string().required("Condition is required"),
    cut: Yup.number().optional().min(0).default(0),
    costPrice: Yup.string().optional().min(0),
    notes: Yup.string().optional().nullable(),
});

export const createReturnSchema = Yup.object({
    returnType: Yup.string().required("Return type is required"),
    returnDate: Yup.date().optional().default(() => new Date()),
    returnReason: Yup.string(),
    invoice: Yup.string().when("returnType", {
        is: "invoice_based",
        then: (s) => s.required("Invoice is required for invoice-based return"),
        otherwise: (s) => s.optional().nullable(),
    }),
    items: Yup.array().of(returnItemSchema).required("Items are required").min(1, "At least one item is required"),
});

export const updateReturnSchema = Yup.object({
    returnType: Yup.string().optional(),
    returnDate: Yup.date().optional(),
    returnReason: Yup.string().optional(),
    invoice: Yup.string().optional().nullable(),
    items: Yup.array().of(returnItemSchema).optional().min(1, "At least one item is required"),
});