import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    lineTotal: {
        type: Number,
        required: true,
        min: 0,
    },
    portionType: {
        type: String,
        enum: ["full", "half", "custom"],
        default: "full",
    },
});

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        subtotal: {
            type: Number,
            required: true,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        items: [orderItemSchema],
        customerName: {
            type: String,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "online", "credit", "free"],
            default: "cash",
        },
        // qarzaAccount: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "QarzaAccount",
        // },
        cashReceived: {
            type: Number,
            default: 0,
        },
        change: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["held", "completed", "cancelled"],
            default: "completed",
        },
        note: {
            type: String,
        },
        splitCount: {
            type: Number,
        },
        perPerson: {
            type: Number,
        },
    },
    { timestamps: true },
);

export default orderSchema;
