import mongoose from "mongoose";
import { getLocalProductModel } from "../../../configs/connect.db.js";

const batchSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
            required: true,
        },
        batchNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Suppliers",
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        mfgDate: {
            type: Date,
        },
        expiryDate: {
            type: Date,
        },
        created: { type: Date, default: Date.now },
        updated: { type: Date },
        isActive: { type: Boolean, default: true },
        discount: {
            amount: Number,
            type: {
                type: String,
                enum: ["percentage", "fixed"],
                default: "percentage",
            },
        },
        gst: {
            type: Number,
            default: 0,
        },
        gstDiscount: {
            type: Number,
            default: 0,
        },
        currentStock: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true },
);

// ─────────────────────────────────────────────────────────────────────────────
//  Hooks to adjust product currentStockLevel when batch stock changes
// ─────────────────────────────────────────────────────────────────────────────

batchSchema.post('save', async function(doc) {
    const ProductModel = getLocalProductModel();
    
    // For new batches, add the currentStock to product's currentStockLevel
    if (doc.isNew) {
        await ProductModel.findByIdAndUpdate(doc.product, {
            $inc: { currentStockLevel: doc.currentStock }
        });
    }
});

batchSchema.post('findOneAndUpdate', async function(doc) {
    if (!doc) return;
    
    const ProductModel = getLocalProductModel();
    
    // Get the previous document to calculate the difference
    const prevDoc = await this.model.findById(doc._id);
    if (!prevDoc) return;
    
    const stockDiff = doc.currentStock - prevDoc.currentStock;
    
    if (stockDiff !== 0) {
        // Update product currentStockLevel with the difference
        await ProductModel.findByIdAndUpdate(doc.product, {
            $inc: { currentStockLevel: stockDiff }
        });
    }
});

batchSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;
    
    const ProductModel = getLocalProductModel();
    
    // Reverse the batch's currentStock from product's currentStockLevel
    await ProductModel.findByIdAndUpdate(doc.product, {
        $inc: { currentStockLevel: -doc.currentStock }
    });
});

export default batchSchema;
