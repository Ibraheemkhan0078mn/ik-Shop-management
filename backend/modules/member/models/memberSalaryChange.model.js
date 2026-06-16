import mongoose from "mongoose";

const memberSalaryChangeSchema = new mongoose.Schema({
    amount: { type: Number },
    date: { type: Date },
    reason: { type: String },
    changeType: { type: String, enum: ["increase", "decrease", "same"] },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Members" },
    perAbsenceCut: { type: Number }
}, { timestamps: true });

export default memberSalaryChangeSchema;
