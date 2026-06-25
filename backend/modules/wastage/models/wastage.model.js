
import mongoose from "mongoose";


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

export default wastageSchema;