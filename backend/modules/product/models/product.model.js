import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // ─── Basic Info ───────────────────────────────────────────
        name: { type: String, trim: true },
        brandName: { type: String, trim: true },
        productCode: { type: String, trim: true },
        barcode: { type: String, unique: true, sparse: true, trim: true },
        description: { type: String, trim: true },
        image: { type: String },

        // ─── Classification ───────────────────────────────────────
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Categories" },
        subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategories" },

        // ─── Units ────────────────────────────────────────────────
        unit: { type: String, default: "pcs" },

        // ─── Pricing ──────────────────────────────────────────────
        defaultCostPrice: { type: Number, default: 0 },
        defaultRetailPrice: { type: Number, default: 0 },
        defaultWholesalePrice: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        taxType: { type: String, default: "percentage" },
        isDiscountAllowed: { type: Boolean, default: true },
        maxDiscountPercent: { type: Number, default: 0 },

        // ─── Stock ────────────────────────────────────────────────
        minStockLevel: { type: Number, default: 5 },
        maxStockLevel: { type: Number, default: 10 },
        allowNegativeStock: { type: Boolean, default: false },
        rackLocation: { type: String, trim: true },

        // ─── Batches & Status ─────────────────────────────────────
        batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batches" }],
        isActive: { type: Boolean, default: true },
        currentStockLevel: {type: Number, default: 0},


        created: { type: Date, default: Date.now },
        updated: { type: Date },



    },
    { timestamps: true }
);

export default productSchema;