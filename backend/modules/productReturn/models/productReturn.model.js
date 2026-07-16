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
            unique: true,
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
        returnDate: {
            type: Date,
            default: Date.now,
        },
        customerName: {
            type: String,
        },
        returnStatus: {
            type: String,
            enum: ["pending", "approved", "rejected", "completed"],
            default: "pending",
        },
        notes: {
            type: String,
        },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

export default productReturnSchema;
