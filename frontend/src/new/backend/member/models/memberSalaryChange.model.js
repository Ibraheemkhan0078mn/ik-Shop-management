import mongoose from 'mongoose';

const MemberSalaryChangeSchema = new mongoose.Schema({
    amount: { type: Number },
    date: { type: Date },
    reason: { type: String },
    changeType: { type: String, enum: ["increase", "decrease", "same"] },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher" },
    perAbsenceCut: { type: Number }
}, { timestamps: true });

export default MemberSalaryChangeSchema 