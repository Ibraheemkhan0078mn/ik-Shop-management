import mongoose from "mongoose";

const purchaseReturnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
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
        ref: "Purchase",
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
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
        default: "draft"
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

purchaseReturnSchema.pre("save", function(next) {
    // Calculate total quantity and refund amount
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalRefundAmount = this.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    this.updatedAt = new Date();
    next();
});

// const PurchaseReturn = mongoose.model("PurchaseReturn", purchaseReturnSchema);

export default purchaseReturnSchema;
