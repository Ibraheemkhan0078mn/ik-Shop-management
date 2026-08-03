import * as yup from "yup";

export const createPurchaseSchema = yup.object({
    supplier: yup.string().required("Supplier ID is required"),
    date: yup.date().default(() => new Date()),
    invoiceNumber: yup.string().nullable(),
    items: yup
        .array()
        .of(
            yup.object({
                product: yup.string().required("Product ID is required"),
                batchNumber: yup.string().required("Batch number is required"),
                quantity: yup.number().min(1).required("Quantity is required"),
                price: yup.number().min(0).required("Price is required"),
                discount: yup.number().min(0).default(0),
                discountType: yup.string().nullable(),
                tax: yup.number().min(0).default(0),
                taxType: yup.string().nullable(),
                mfgDate: yup.date().nullable(),
                expiryDate: yup.date().nullable(),
            }),
        )
        .min(1, "At least one item is required"),
    subtotal: yup.number().min(0).required("Subtotal is required"),
    discount: yup.number().min(0).default(0),
    discountType: yup
        .string()
        .oneOf(["percentage", "fixed"])
        .default("percentage"),
    gst: yup.number().min(0).default(0),
    gstType: yup.string().oneOf(["percentage", "fixed"]).default("percentage"),
    shippingCost: yup.number().min(0).default(0),
    totalAmount: yup.number().min(0).required("Total amount is required"),
    notes: yup.string().nullable(),
});




export const updatePurchaseSchema = yup.object({
    supplier: yup.string().required("Supplier ID is required"),
    date: yup.date().default(() => new Date()),
    invoiceNumber: yup.string().nullable(),
    items: yup
        .array()
        .of(
            yup.object({
                product: yup.string().required("Product ID is required"),
                batchNumber: yup.string().required("Batch number is required"),
                quantity: yup.number().min(1).required("Quantity is required"),
                price: yup.number().min(0).required("Price is required"),
                discount: yup.number().min(0).default(0),
                discountType: yup.string().nullable(),
                tax: yup.number().min(0).default(0),
                taxType: yup.string().nullable(),
                mfgDate: yup.date().nullable(),
                expiryDate: yup.date().nullable(),
            }),
        )
        .min(1, "At least one item is required"),
    subtotal: yup.number().min(0).default(0),
    discount: yup.number().min(0).default(0),
    discountType: yup.string().nullable(),
    gst: yup.number().min(0).default(0),
    gstType: yup.string().oneOf(["percentage", "fixed"]).default("percentage"),
    shippingCost: yup.number().min(0).default(0),
    totalAmount: yup.number().min(0).default(0),
    notes: yup.string().nullable(),
});