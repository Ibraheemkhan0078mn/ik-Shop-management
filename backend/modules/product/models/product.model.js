

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // ─── Basic Info ───────────────────────────────────────────────
        name: { type: String, trim: true },
        genericName: { type: String, trim: true },
        brandName: { type: String, trim: true },
        hotKeySku: { type: String, unique: true, trim: true },
        productCode: { type: String, trim: true },
        barcode: { type: String, unique: true, sparse: true, trim: true },
        description: { type: String, trim: true },
        image: { type: String },

        // ─── Classification ───────────────────────────────────────────
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Categories" },
        subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategories" },
        form: { type: String, trim: true },
        strength: { type: String, trim: true },
        drugType: { type: String, trim: true },
        scheduleType: { type: String, trim: true },
        isNarcotic: { type: Boolean, default: false },

        // ─── Units ────────────────────────────────────────────────────
        unit: { type: String, default: "Units" },
        purchaseUnit: { type: String, default: "Box" },

        // ─── Manufacturer & Supplier ──────────────────────────────────
        manufacturer: { type: String, trim: true },
        defaultSupplier: { type: String },
        countryOfOrigin: { type: String, trim: true },

        // ─── Pricing Defaults ─────────────────────────────────────────
        defaultSalePrice: { type: Number, default: 0 },
        defaultPurchasePrice: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        isDiscountAllowed: { type: Boolean, default: true },

        // ─── Stock Settings ───────────────────────────────────────────
        minStockLevel: { type: Number, default: 0 },
        maxStockLevel: { type: Number, default: 0 },
        currentStockLevel: { type: Number, default: 0 },
        allowNegativeStock: { type: Boolean, default: false },
        rackLocation: { type: String, trim: true },
        storageCondition: { type: String, trim: true },

        // ─── Medical Info ─────────────────────────────────────────────
        drugInteractionWarning: { type: String, trim: true },

        // ─── Batches & Status ─────────────────────────────────────────
        batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batches" }],
        isActive: { type: Boolean, default: true },

        // ─── Timestamps ───────────────────────────────────────────────
        created: { type: Date, default: Date.now },
        updated: { type: Date },
    },
    { timestamps: true },
);

export default productSchema;