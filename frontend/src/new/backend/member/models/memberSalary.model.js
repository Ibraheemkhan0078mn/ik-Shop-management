import mongoose from "mongoose";

const memberSalaryPaymentSchema = new mongoose.Schema(
  {
    salaryAmount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    paymentMethod: {
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
    member:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"member"
    }
  },
  { timestamps: true }
);

export default memberSalaryPaymentSchema