import mongoose from "mongoose";
import { adjustStock } from "../../../common/services/stockManager.js";

const productReturnItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
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
            ref: "Order",
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
    },
    {
        timestamps: true,
    }
);

// ─────────────────────────────────────────────────────────────────────────────
//  Hooks to adjust batch stock and product currentStockLevel
//  Customer returns restock on approval
// ─────────────────────────────────────────────────────────────────────────────

productReturnSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    const isApproving = update?.returnStatus === 'approved' || update?.$set?.returnStatus === 'approved';
    if (isApproving) {
        const doc = await this.model.findOne(this.getQuery()).lean();
        this._itemsToRestock = doc ? doc.items : [];
    }
});

productReturnSchema.post('findOneAndUpdate', async function() {
    if (!this._itemsToRestock) return;
    for (const item of this._itemsToRestock) {
        // Customer returned product → add back to stock
        await adjustStock(item.productId, item.batchId, item.quantity);
    }
});

export default productReturnSchema;
