import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
//  Each product line inside a held (paused) order
// ─────────────────────────────────────────────────────────────────────────────
const holdItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    portionType: { type: String, enum: ["full", "half", "custom"], default: "full" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    batchNumber: { type: String, default: null },
});

// ─────────────────────────────────────────────────────────────────────────────
//  A paused order — saved so the cashier can resume it later.
//  Deleted automatically after the order is completed or cancelled.
// ─────────────────────────────────────────────────────────────────────────────
const holdOrderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        items: { type: [holdItemSchema], required: true },
        subtotal: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, default: 0 },
        customerName: { type: String, default: "" },
        waiter: { type: String, default: "" },
        note: { type: String, default: "" },
    },
    { timestamps: true },
);

export default holdOrderSchema;
