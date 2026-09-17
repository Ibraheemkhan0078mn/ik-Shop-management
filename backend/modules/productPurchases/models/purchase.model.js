import mongoose from "mongoose";

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
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
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
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
            enum: ["ordered", "delivered", "rejected"],
            default: "ordered",
        },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updatedTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export default purchaseSchema;
