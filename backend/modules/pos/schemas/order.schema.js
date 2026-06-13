import * as yup from "yup";

// ─────────────────────────────────────────────────────────────────────────────
//  Yup validation schema for creating a completed order.
//  Used inside order.controller.js → addOrder().
// ─────────────────────────────────────────────────────────────────────────────

const orderItemValidation = yup.object({
    product:       yup.string().required("Product ID is required"),
    name:          yup.string().required("Product name is required"),
    quantity:      yup.number().min(1).required("Quantity is required"),
    unitPrice:     yup.number().min(0).required("Unit price is required"),
    originalPrice: yup.number().min(0).required("Original price is required"),
    lineTotal:     yup.number().min(0).required("Line total is required"),
    portionType:   yup.string().oneOf(["full", "half", "custom"]).default("full"),
    batchId:       yup.string().nullable().default(null),
    batchNumber:   yup.string().nullable().default(null),
});

export const createOrderSchema = yup.object({
    orderNumber:    yup.string().required("Order number is required"),
    subtotal:       yup.number().min(0).required("Subtotal is required"),
    discountAmount: yup.number().min(0).default(0),
    totalAmount:    yup.number().min(0).required("Total amount is required"),
    items:          yup.array().of(orderItemValidation).min(1, "At least one item is required"),

    customerName: yup.string().nullable().default(""),
    waiter:       yup.string().nullable().default(""),
    note:         yup.string().nullable().default(""),

    paymentMethod: yup.string().oneOf(["cash", "online", "credit", "hybrid", "free"]).default("cash"),

    // Cash
    cashReceived: yup.number().min(0).default(0),
    change:       yup.number().min(0).default(0),

    // Online
    onlinePlatform: yup.string().nullable().default(""),
    onlineAmount:   yup.number().min(0).default(0),

    // Qarza (credit)
    qarzaAccount: yup.string().nullable().default(null),

    // Hybrid
    hybridCash:         yup.number().min(0).default(0),
    hybridQarza:        yup.number().min(0).default(0),
    hybridQarzaAccount: yup.string().nullable().default(null),

    status: yup.string().oneOf(["completed", "cancelled"]).default("completed"),
});
