// transaction.schema.js
import mongoose from "mongoose";
const expenseSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
        },
        notes: {
            type: String,
            default: '',
        },
        category: {
            type: String
        },
        createdOn: {
            type: Date,
            default: Date.now
        },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

export default expenseSchema