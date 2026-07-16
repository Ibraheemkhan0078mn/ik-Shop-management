import mongoose from "mongoose";

const staffSalaryPaymentSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true,
        trim: true
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'paid'
    },
    notes: {
        type: String,
        trim: true
    },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

export default staffSalaryPaymentSchema;
