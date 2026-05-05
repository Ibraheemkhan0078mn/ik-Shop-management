import mongoose from "mongoose";

const memberInvestmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher",  required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    paymentMethod: { type: String },
    usedIn: { type: String }
},
    {
        timestamps: true
    });

export default memberInvestmentSchema;
