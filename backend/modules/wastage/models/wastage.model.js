
import mongoose from "mongoose";
import { getLocalBatchModel, getLocalProductModel } from "../../../configs/connect.db.js";


const wastageSchema = new mongoose.Schema({
    // Reference
    wastageNumber: { type: String, required: true, unique: true },           // Auto-generated e.g. WST-0001
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },  // Which shop/pharmacy

    // Wastage Meta
    wastageDate: { type: Date, default: Date.now },
    reason: { type: String },
    notes: { type: String },                                          // Extra detail if reason = other

    // Items
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batches' },
        batchNumber: { type: String },
        reason: { type: String },                                      // Which batch was wasted (important for pharmacy)
        expiryDate: { type: Date },                                            // Batch expiry (for expired reason)
        quantity: { type: Number, required: true },                          // How many units wasted
        unit: { type: String },                                          // e.g. tablet, bottle, strip, piece
        costPrice: { type: Number },                                          // Cost at time of wastage (for loss report)
        totalLoss: { type: Number },                                          // quantity × costPrice
    }],

    // Totals
    totalItems: { type: Number },                                          // Total line items count
    totalQuantity: { type: Number },                                          // Sum of all quantities
    totalLossAmount: { type: Number },                                          // Sum of all totalLoss

    // Approval Flow (optional but recommended for pharmacy)
    status: { type: String, default: 'draft' },
    // approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },

    // Audit
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────────────────────
//  Hooks to adjust batch stock and product currentStockLevel
// ─────────────────────────────────────────────────────────────────────────────

wastageSchema.post('save', async function(doc) {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Decrease batch currentStock
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: -item.quantity }
        });
        
        // Decrease product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: -item.quantity }
        });
    }
});

wastageSchema.post('findOneAndUpdate', async function(doc) {
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
            // Update batch currentStock (negative because wastage reduces stock)
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

wastageSchema.post('findOneAndDelete', async function(doc) {
    if (!doc) return;
    
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    
    for (const item of doc.items) {
        if (!item.batch) continue;
        
        // Reverse the batch currentStock (add back the wasted quantity)
        await BatchModel.findByIdAndUpdate(item.batch, {
            $inc: { currentStock: item.quantity }
        });
        
        // Reverse the product currentStockLevel
        await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { currentStockLevel: item.quantity }
        });
    }
});


export default wastageSchema