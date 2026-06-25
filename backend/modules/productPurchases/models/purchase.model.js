import mongoose from "mongoose";
import { getLocalBatchModel, getLocalProductModel } from "../../../configs/connect.db.js";

const purchaseItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batches",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    discountType: {
        type: String,
    },
    tax: {
        type: Number,
        default: 0,
    },
    taxType: {
        type: String,
    },
    mfgDate: {
        type: Date,
    },
    expiryDate: {
        type: Date,
    },
});

const purchaseSchema = new mongoose.Schema(
    {
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Suppliers",
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        invoiceNumber: {
            type: String,
            trim: true,
        },
        items: [purchaseItemSchema],
        subtotal: {
            type: Number,
            required: true,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "percentage",
        },
        gst: {
            type: Number,
            default: 0,
        },
        shippingCost: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true },
);

// ─────────────────────────────────────────────────────────────────────────────
//  Hooks to adjust batch stock and product currentStockLevel
// ─────────────────────────────────────────────────────────────────────────────

purchaseSchema.post('save', async function(doc) {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Update batch currentStock
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: item.quantity }
        });
        
        // Update product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: item.quantity }
        });
    }
});

purchaseSchema.post('findOneAndUpdate', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    // Get the previous document to calculate the difference
    const prevDoc = await this.model.findById(doc._id);
    if (!prevDoc) return;
    
    for (let i = 0; i < doc.items.length; i++) {
        const newItem = doc.items[i];
        const oldItem = prevDoc.items[i];
        
        if (!newItem.batch || !oldItem) continue;
        
        const qtyDiff = newItem.quantity - oldItem.quantity;
        
        if (qtyDiff !== 0) {
            // Update batch currentStock
            await BatchModel.findByIdAndUpdate(newItem.batch, {
                $inc: { currentStock: qtyDiff }
            });
            
            // Update product currentStockLevel
            await ProductModel.findByIdAndUpdate(newItem.product, {
                $inc: { currentStockLevel: qtyDiff }
            });
        }
    }
});

purchaseSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Reverse the batch currentStock
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: -item.quantity }
        });
        
        // Reverse the product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: -item.quantity }
        });
    }
});

export default purchaseSchema;
