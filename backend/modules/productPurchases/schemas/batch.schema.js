import * as yup from "yup";

export const createBatchSchema = yup.object({
    product: yup.string().required("Product ID is required"),
    batchNumber: yup.string().required("Batch number is required"),
    supplier: yup.string().nullable(),
    manufacturer: yup.string().nullable(),
    quantity: yup
        .number()
        .min(0, "Quantity cannot be negative")
        .required("Quantity is required"),
    purchasePrice: yup
        .number()
        .min(0, "Purchase price cannot be negative")
        .required("Purchase price is required"),
    sellingPrice: yup
        .number()
        .min(0, "Selling price cannot be negative")
        .required("Selling price is required"),
    mfgDate: yup.date().nullable(),
    expiryDate: yup.date().nullable(),
    isActive: yup.boolean().default(true),
    discount: yup.object({
        amount: yup.number().min(0),
        type: yup.string().oneOf(["percentage", "fixed"]),
    }),
    gst: yup.number().min(0),
    gstDiscount: yup.number().min(0),
});

export const updateBatchSchema = yup.object({
    batchNumber: yup.string(),
    supplier: yup.string().nullable(),
    manufacturer: yup.string().nullable(),
    quantity: yup.number().min(0),
    purchasePrice: yup.number().min(0),
    sellingPrice: yup.number().min(0),
    mfgDate: yup.date().nullable(),
    expiryDate: yup.date().nullable(),
    isActive: yup.boolean().default(true),
    discount: yup.object({
        amount: yup.number().min(0),
        type: yup.string().oneOf(["percentage", "fixed"]),
    }),
    gst: yup.number().min(0),
    gstDiscount: yup.number().min(0),
});
