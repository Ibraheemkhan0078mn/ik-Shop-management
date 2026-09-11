import mongoose from "mongoose";

// Costing breakdown sub-schema — mirrors what the CRUD form calculates per batch
const purchaseReturnItemCostingSchema = new mongoose.Schema({
    purchasedDiscount: { type: Number, default: 0 },        // discount value (% or fixed)
    purchaseDiscountType: { type: String, default: "percentage" }, // "percentage" | "fixed"
    purchasedTax: { type: Number, default: 0 },             // tax value (% or fixed)
    purchasedTaxType: { type: String, default: "percentage" }, // "percentage" | "fixed"
    purchasedDiscountAmount: { type: Number, default: 0 },  // computed discount in Rs per unit
    purchasedTaxAmount: { type: Number, default: 0 },       // computed tax in Rs per unit
    totalCostingAmount: { type: Number, default: 0 },       // effective unit cost = price - discount + tax
}, { _id: false });

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
    },
    // Full costing breakdown stored per item so recalculation does not need to re-derive it
    costing: {
        type: purchaseReturnItemCostingSchema,
        default: null
    }
}, { _id: false });

const purchaseReturnSchema = new mongoose.Schema({
    purchaseReturnNumber: {
        type: String,
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
    refundedAmount: {
        type: Number,
        default: 0
    },
    refundStatus: {
        type: String,
        enum: ["pending", "partial", "full"],
        default: "pending"
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
    },
    // Sync Fields
    createdTimeForSync: { type: Date, default: Date.now },
    updateTimeForSync: { type: Date, default: Date.now },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
});

export default purchaseReturnSchema;
