import mongoose from "mongoose";

const productReturnItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batches",
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    returnReason: {
        type: String,
        required: true,
        enum: ["damaged", "defective", "wrong-item", "not-needed", "other"],
    },
    originalPrice: {
        type: Number,
        required: true,
    },
    cut: {
        type: Number,
        default: 0,
        min: 0,
    },
    refundAmount: {
        type: Number,
        required: true,
    },
    // Costing breakdown sub-schema — mirrors what the order originally stored
    costing: {
        type: new mongoose.Schema({
            taxPercent: { type: Number, default: 0 },
            taxType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
            taxAmount: { type: Number, default: 0 },
            discountPercent: { type: Number, default: 0 },
            discountAmount: { type: Number, default: 0 },
            discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
            itemTotal: { type: Number, default: 0 }, // representing final unit costing
        }, { _id: false }),
        default: () => ({})
    },
    // Order discount share for recalculation
    perItemOrderDiscountShare: {
        type: new mongoose.Schema({
            orderDiscountValue: { type: Number, default: 0 }, // Original order discount input (e.g., 10 for 10% or 100 for Rs 100)
            orderDiscountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
            orderDiscountAmount: { type: Number, default: 0 }, // Total order discount amount
            orderSubtotal: { type: Number, default: 0 }, // Order subtotal before discount
            itemQuantityInOrder: { type: Number, default: 0 }, // Quantity of this item in the original order
            itemLineTotal: { type: Number, default: 0 }, // Line total of this item in the original order
            perUnitOrderDiscountShare: { type: Number, default: 0 }, // Per-unit order discount share for this item
        }, { _id: false }),
        default: () => ({})
    }
});

const productReturnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: String,
            required: true,
        },
        referenceOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Orders",
            required: true,
        },
        referenceOrderNumber: {
            type: String,
            required: true,
        },
        items: [productReturnItemSchema],
        totalRefundAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        refundedAmount: {
            type: Number,
            default: 0,
        },
        refundStatus: {
            type: String,
            enum: ["pending", "partial", "fully_refunded"],
            default: "pending",
        },
        returnDate: {
            type: Date,
            default: Date.now,
        },
        customerName: {
            type: String,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customers",
        },
        returnStatus: {
            type: String,
            enum: ["pending", "approved", "rejected", "completed"],
            default: "pending",
        },
        notes: {
            type: String,
        },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

export default productReturnSchema;
