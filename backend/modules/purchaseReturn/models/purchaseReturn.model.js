import mongoose from "mongoose";

const purchaseReturnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batches",
        required: true
    },
    batchNumber: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    returnReason: {
        type: String,
        required: true,
        enum: ["damaged", "expired", "wrong_item", "excess", "quality_issue", "other"]
    },
    condition: {
        type: String,
        required: true,
        enum: ["good", "fair", "poor", "damaged"]
    },
    cut: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String
    }
}, { _id: false });

const purchaseReturnSchema = new mongoose.Schema({
    purchaseReturnNumber: {
        type: String,
        unique: true,
        required: true
    },
    purchase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchases",
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Suppliers",
        required: true
    },
    returnDate: {
        type: Date,
        default: Date.now
    },
    items: [purchaseReturnItemSchema],
    totalQuantity: {
        type: Number,
        default: 0
    },
    totalRefundAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["draft", "pending", "approved", "rejected"],
        default: "pending"
    },
    notes: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default purchaseReturnSchema;
