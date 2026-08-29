import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
//  Each product line inside a completed order
// ─────────────────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },  // price before any portion split
    lineTotal: { type: Number, required: true, min: 0 },  // unitPrice × quantity
    portionType: { type: String, enum: ["full", "half", "custom"], default: "full" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    batchNumber: { type: String, default: null },
    // Tax and discount per item
    taxPercent: { type: Number, default: 0 },
    taxType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    taxAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    maxDiscountPercent: { type: Number, default: 0 },
    discountLimitType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    itemTotal: { type: Number, required: true, min: 0 },  // final total including tax and discount
    customInput: { type: Boolean, default: false },  // boolean flag to identify if price was custom input or default
});

// ─────────────────────────────────────────────────────────────────────────────
//  A completed (or cancelled) sales order
// ─────────────────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true },

        // Money
        subtotal: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, default: 0 },
        totalTaxAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, default: 0 },
        paid: { type: Number, default: 0 },
        remainingAmount: { type: Number, default: 0 },

        items: [orderItemSchema],

        // Who
        customerName: { type: String, default: "" },
        customerType: { type: String, enum: ["walkin", "regular"], default: "walkin" },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
        waiter: { type: String, default: "" },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
        staffCommission: { type: Number, default: 0 }, // Commission amount for percentage-based staff

        // Order Type
        orderType: {
            type: String,
            enum: ["retail", "wholesale"],
            default: "retail",
        },

        status: {
            type: String,
            enum: ["completed", "cancelled"],
            default: "completed",
        },
        isPosOrder: {
            type: Boolean,
            default: false,
        },
        note: { type: String, default: "" },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export default orderSchema;
