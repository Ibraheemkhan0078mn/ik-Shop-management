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
});

// ─────────────────────────────────────────────────────────────────────────────
//  A completed (or cancelled) sales order
// ─────────────────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },

        // Money
        subtotal: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, default: 0 },

        items: [orderItemSchema],

        // Who
        customerName: { type: String, default: "" },
        waiter: { type: String, default: "" },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

        // Order Type
        orderType: {
            type: String,
            enum: ["retail", "wholesale"],
            default: "retail",
        },

        // Payment
        paymentMethod: {
            type: String,
            enum: ["cash", "online", "credit", "hybrid", "free"],
            default: "cash",
        },
        cashReceived: { type: Number, default: 0 },
        change: { type: Number, default: 0 },

        // Online payment
        onlinePlatform: { type: String, default: "" },
        onlineAmount: { type: Number, default: 0 },

        // Qarza (credit) — single account
        qarzaAccount: { type: mongoose.Schema.Types.ObjectId, ref: "QarzaAccount", default: null },

        // Hybrid payment (part cash, part qarza)
        hybridCash: { type: Number, default: 0 },
        hybridQarza: { type: Number, default: 0 },
        hybridQarzaAccount: { type: mongoose.Schema.Types.ObjectId, ref: "QarzaAccount", default: null },

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
    },
    { timestamps: true },
);

export default orderSchema;
