import mongoose from "mongoose";

const partnerInvestmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Members", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    paymentMethod: { type: String },
    usedIn: { type: String }
}, { timestamps: true });

export default partnerInvestmentSchema;
