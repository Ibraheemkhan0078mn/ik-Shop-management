import mongoose from "mongoose";

const QarzaPaymentSchema = new mongoose.Schema(
  {
    qarzaAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QarzaAccount",
      required: true,
    },
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
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
   
  },
  { timestamps: true }
);

export default QarzaPaymentSchema
