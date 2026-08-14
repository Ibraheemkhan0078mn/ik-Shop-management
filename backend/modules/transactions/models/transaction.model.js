import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        // Reference to the source entity (purchase, sale, expense, qarza, staff_salary, other)
        sourceType: {
            type: String,
            enum: ["purchase", "sale", "expense", "qarza", "staff_salary", "other", "pos-order", "purchaseReturn", "orderReturn"],
            required: true,
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        
        // Payment method: cash, credit, or hybrid
        method: {
            type: String,
            enum: ["cash", "credit", "hybrid"],
            required: true,
        },
        
        // Amount details
        amount: {
            type: Number,
            required: true,
            default: 0,
        },
        cashAmount: {
            type: Number,
            default: 0,
        },
        creditAmount: {
            type: Number,
            default: 0,
        },
        
        // Credit account reference (for credit/hybrid transactions)
        creditAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QarzaAccount",
        },
        
        // Credit type: cashin (we receive credit) or cashout (we give credit)
        creditType: {
            type: String,
            enum: ["cashin", "cashout"],
        },
        
        // Payment method reference (for cash transactions)
        paymentMethod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentMethods",
        },
        paymentMethodName: {
            type: String,
        },
        
        // Transaction date
        transactionDate: {
            type: Date,
            default: Date.now,
        },
        
        // Notes
        notes: {
            type: String,
        },
        
        // User who created the transaction
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
        
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default transactionSchema;
