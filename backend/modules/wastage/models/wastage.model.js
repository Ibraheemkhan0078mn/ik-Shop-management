
import mongoose from "mongoose";
import { adjustStock } from "../../../common/services/stockManager.js";


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
//  Stock for wastage must ONLY be deducted when status becomes "approved"
// ─────────────────────────────────────────────────────────────────────────────

wastageSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    const isApproving = update?.status === 'approved' || update?.$set?.status === 'approved';
    if (isApproving) {
        const doc = await this.model.findOne(this.getQuery()).lean();
        this._wastageItemsToDeduct = doc ? doc.items : [];
    }
});

wastageSchema.post('findOneAndUpdate', async function(doc) {
    if (!this._wastageItemsToDeduct) return;
    for (const item of this._wastageItemsToDeduct) {
        await adjustStock(item.product, item.batch, -item.quantity);
    }
});

// On delete of a draft wastage → no stock change needed (was never deducted)
// On delete of an approved wastage → restore stock
wastageSchema.pre('findOneAndDelete', async function() {
    const doc = await this.model.findOne(this.getQuery()).lean();
    this._deletedWastage = doc;
});

wastageSchema.post('findOneAndDelete', async function() {
    const doc = this._deletedWastage;
    if (!doc || doc.status !== 'approved') return; // only restore if was approved
    for (const item of doc.items) {
        await adjustStock(item.product, item.batch, item.quantity);
    }
});


export default wastageSchema