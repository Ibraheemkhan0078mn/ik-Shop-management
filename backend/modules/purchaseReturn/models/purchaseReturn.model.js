import mongoose from "mongoose";
import { getLocalBatchModel, getLocalProductModel } from "../../../configs/connect.db.js";

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
// ─────────────────────────────────────────────────────────────────────────────

purchaseReturnSchema.post('save', async function(doc) {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Decrease batch currentStock (purchase returns remove stock)
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: -item.quantity }
        });
        
        // Decrease product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: -item.quantity }
        });
    }
});

purchaseReturnSchema.post('findOneAndUpdate', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    const prevDoc = await this.model.findById(doc._id);
    if (!prevDoc) return;
    
    for (let i = 0; i < doc.items.length; i++) {
        const newItem = doc.items[i];
        const oldItem = prevDoc.items[i];
        
        if (!newItem.batch || !oldItem) continue;
        
        const qtyDiff = newItem.quantity - oldItem.quantity;
        
        if (qtyDiff !== 0) {
            // Update batch currentStock (negative because purchase return reduces stock)
            await BatchModel.findByIdAndUpdate(newItem.batch, {
                $inc: { currentStock: -qtyDiff }
            });
            
            // Update product currentStockLevel
            await ProductModel.findByIdAndUpdate(newItem.product, {
                $inc: { currentStockLevel: -qtyDiff }
            });
        }
    }
});

purchaseReturnSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Reverse the batch currentStock (add back the returned quantity)
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: item.quantity }
        });
        
        // Reverse the product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: item.quantity }
        });
    }
});



export default purchaseReturnSchema;
