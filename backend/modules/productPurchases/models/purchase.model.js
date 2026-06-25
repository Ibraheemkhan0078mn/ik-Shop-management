import mongoose from "mongoose";
import { adjustStock } from "../../../common/services/stockManager.js";

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

// PRE-SAVE: store old items snapshot for update diff
purchaseSchema.pre('save', async function() {
    if (!this.isNew) {
        const old = await this.constructor.findById(this._id).lean();
        this._oldItems = old ? old.items : [];
    }
});

// PRE-UPDATE: store old items snapshot for update diff
purchaseSchema.pre('findOneAndUpdate', async function() {
    const doc = await this.model.findOne(this.getQuery()).lean();
    this._oldItems = doc ? doc.items : [];
});

// POST-SAVE: on create → add stock. On update → diff old vs new.
purchaseSchema.post('save', async function(doc) {
    if (doc._skipStockHook) return;
    if (doc.isNew || !doc._oldItems) {
        // New purchase created → add stock for all items
        for (const item of doc.items) {
            await adjustStock(item.product, item.batch, item.quantity);
        }
    } else {
        // Updated purchase → reverse old, apply new
        for (const old of doc._oldItems) {
            await adjustStock(old.product, old.batch, -old.quantity);
        }
        for (const item of doc.items) {
            await adjustStock(item.product, item.batch, item.quantity);
        }
    }
});

// POST-UPDATE: diff old vs new
purchaseSchema.post('findOneAndUpdate', async function(doc) {
    if (!doc || doc._skipStockHook) return;
    if (!this._oldItems) {
        // No old items found, treat as create
        for (const item of doc.items) {
            await adjustStock(item.product, item.batch, item.quantity);
        }
    } else {
        // Updated purchase → reverse old, apply new
        for (const old of this._oldItems) {
            await adjustStock(old.product, old.batch, -old.quantity);
        }
        for (const item of doc.items) {
            await adjustStock(item.product, item.batch, item.quantity);
        }
    }
});

// POST-DELETE: reverse all stock
purchaseSchema.post('findOneAndDelete', async function(doc) {
    if (!doc || doc._skipStockHook) return;
    for (const item of doc.items) {
        await adjustStock(item.product, item.batch, -item.quantity);
    }
});

export default purchaseSchema;
