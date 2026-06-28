import mongoose from "mongoose";

const purchasePaymentSchema = new mongoose.Schema(
    {
        purchase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchases",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "credit", "hybrid"],
            default: "cash",
        },
        creditAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QarzaAccount",
        },
        cashAmount: {
            type: Number,
            default: 0,
        },
        creditAmount: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
    },
    { timestamps: true },
);

export default purchasePaymentSchema;
