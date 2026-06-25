import mongoose from "mongoose";
import { getLocalBatchModel, getLocalProductModel } from "../../../configs/connect.db.js";

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
// ─────────────────────────────────────────────────────────────────────────────

productReturnSchema.post('save', async function(doc) {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batchId) continue;
        
        // Increase batch currentStock (returned items go back to stock)
        await BatchModel.findByIdAndUpdate(item.batchId, {
            $inc: { currentStock: item.quantity }
        });
        
        // Increase product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { currentStockLevel: item.quantity }
        });
    }
});

productReturnSchema.post('findOneAndUpdate', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    const prevDoc = await this.model.findById(doc._id);
    if (!prevDoc) return;
    
    for (let i = 0; i < doc.items.length; i++) {
        const newItem = doc.items[i];
        const oldItem = prevDoc.items[i];
        
        if (!newItem.batchId || !oldItem) continue;
        
        const qtyDiff = newItem.quantity - oldItem.quantity;
        
        if (qtyDiff !== 0) {
            // Update batch currentStock
            await BatchModel.findByIdAndUpdate(newItem.batchId, {
                $inc: { currentStock: qtyDiff }
            });
            
            // Update product currentStockLevel
            await ProductModel.findByIdAndUpdate(newItem.productId, {
                $inc: { currentStockLevel: qtyDiff }
            });
        }
    }
});

productReturnSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batchId) continue;
        
        // Reverse the batch currentStock
        await BatchModel.findByIdAndUpdate(item.batchId, {
            $inc: { currentStock: -item.quantity }
        });
        
        // Reverse the product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { currentStockLevel: -item.quantity }
        });
    }
});

export default productReturnSchema;
