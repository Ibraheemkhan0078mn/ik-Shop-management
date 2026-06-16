import mongoose from "mongoose";

const classPartnershipSchema = new mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Members", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "class", required: true },
    type: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    value: { type: Number, required: true },
    timing: { type: String, enum: ["startOfClass", "custom"], default: "startOfClass" },
    startDate: { type: Date, required: true, default: Date.now },
    hasEndDate: { type: Boolean, default: false },
    endDate: { type: Date },
    totalClassAmount: { type: Number },
    earnedAmount: { type: Number },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number },
    earnedFrom: [{
        name: { type: String },
        rollNo: { type: String },
        totalFeeDeposit: { type: Number },
        partnerEarned: { type: Number }
    }],
    payments: [{
        amount: { type: Number },
        paymentDate: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default classPartnershipSchema;
