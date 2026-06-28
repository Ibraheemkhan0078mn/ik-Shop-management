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
        status: {
            type: String,
            enum: ["ordered", "delivered", "rejected"],
            default: "ordered",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "partial", "full"],
            default: "pending",
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

export default purchaseSchema;
