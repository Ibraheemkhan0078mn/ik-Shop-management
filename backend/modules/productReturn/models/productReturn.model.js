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
