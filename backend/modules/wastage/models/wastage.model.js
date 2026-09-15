
import mongoose from "mongoose";


const wastageSchema = new mongoose.Schema({
    // Reference
    wastageNumber: { type: String, required: true },           // Auto-generated e.g. WST-0001
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
        baseCostPrice: { type: Number, default: 0 },                         // Batch purchase price before adjustments
        discountValue: { type: Number, default: 0 },
        discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        discountAmount: { type: Number, default: 0 },
        taxValue: { type: Number, default: 0 },
        taxType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        taxAmount: { type: Number, default: 0 },
        purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchases' },
        invoiceDiscountValue: { type: Number, default: 0 },
        invoiceDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        invoiceDiscountAmount: { type: Number, default: 0 },
        invoiceTaxValue: { type: Number, default: 0 },
        invoiceTaxType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        invoiceTaxAmount: { type: Number, default: 0 },
        shippingAmount: { type: Number, default: 0 },
        costPrice: { type: Number, default: 0 },                              // Effective cost at time of wastage
        totalLoss: { type: Number },                                          // quantity × costPrice
    }],

    // Totals
    totalItems: { type: Number },                                          // Total line items count
    totalQuantity: { type: Number },                                          // Sum of all quantities
    totalLossAmount: { type: Number },                                          // Sum of all totalLoss

    // Approval Flow (optional but recommended for pharmacy)
    status: { type: String, default: 'pending' },
    // approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },

    // Audit
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Sync Fields
    createdTimeForSync: { type: Date, default: Date.now },
    updateTimeForSync: { type: Date, default: Date.now },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

export default wastageSchema;