import mongoose from "mongoose";

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
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        costPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        originPurchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchases",
            default: null,
            index: true,
        },
        perUnitCosting: {
            type: Number,
            default: 0,
            min: 0,
        },
        defaultSellingPrice: {
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
        discountInPercentage: {
            type: Number,
            default: 0,
        },
        discountEntryType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "percentage",
        },
        discountEntryValue: {
            type: Number,
            default: 0,
        },
        discountScope: {
            type: String,
            enum: ["entire", "perUnit"],
            default: "entire",
        },
        taxInPercentage: {
            type: Number,
            default: 0,
        },
        taxEntryType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "percentage",
        },
        taxEntryValue: {
            type: Number,
            default: 0,
        },
        taxScope: {
            type: String,
            enum: ["entire", "perUnit"],
            default: "entire",
        },
        createdTimeForSync: { type: Date, default: Date.now },
        updatedTimeForSync: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: { createdAt: "created", updatedAt: "updated" } },
);

export default batchSchema;
