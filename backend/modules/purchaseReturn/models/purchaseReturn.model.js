import mongoose from "mongoose";
import { adjustStock } from "../../../common/services/stockManager.js";

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



// ─────────────────────────────────────────────────────────────────────────────
//  Hooks to adjust batch stock and product currentStockLevel
//  Stock deduction for purchase return only happens on approval
// ─────────────────────────────────────────────────────────────────────────────

purchaseReturnSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    const isApproving = update?.status === 'approved' || update?.$set?.status === 'approved';
    if (isApproving) {
        const doc = await this.model.findOne(this.getQuery()).lean();
        this._itemsToDeduct = doc ? doc.items : [];
    }
});

purchaseReturnSchema.post('findOneAndUpdate', async function() {
    if (!this._itemsToDeduct) return;
    for (const item of this._itemsToDeduct) {
        await adjustStock(item.product, item.batch, -item.quantity);
    }
});



export default purchaseReturnSchema;
