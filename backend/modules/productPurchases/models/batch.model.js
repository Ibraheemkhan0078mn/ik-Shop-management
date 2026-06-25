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

export default batchSchema;
