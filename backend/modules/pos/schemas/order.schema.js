import * as yup from "yup";

export const createOrderSchema = yup.object({
    orderNumber: yup.string().required("Order number is required"),
    subtotal: yup.number().min(0).required("Subtotal is required"),
    discountAmount: yup.number().min(0).default(0),
    totalAmount: yup.number().min(0).required("Total amount is required"),
    items: yup
        .array()
        .of(
            yup.object({
                product: yup.string().required("Product ID is required"),
                name: yup.string().required("Product name is required"),
                quantity: yup.number().min(1).required("Quantity is required"),
                unitPrice: yup
                    .number()
                    .min(0)
                    .required("Unit price is required"),
                originalPrice: yup
                    .number()
                    .min(0)
                    .required("Original price is required"),
                lineTotal: yup
                    .number()
                    .min(0)
                    .required("Line total is required"),
                portionType: yup
                    .string()
                    .oneOf(["full", "half", "custom"])
                    .default("full"),
            }),
        )
        .min(1, "At least one item is required"),
    customerName: yup.string().nullable(),
    paymentMethod: yup
        .string()
        .oneOf(["cash", "online", "credit", "free"])
        .default("cash"),
    // qarzaAccount: yup.string().nullable(),
    cashReceived: yup.number().min(0).default(0),
    change: yup.number().min(0).default(0),
    status: yup
        .string()
        .oneOf(["held", "completed", "cancelled"])
        .default("completed"),
    note: yup.string().nullable(),
    splitCount: yup.number().nullable(),
    perPerson: yup.number().nullable(),
});
