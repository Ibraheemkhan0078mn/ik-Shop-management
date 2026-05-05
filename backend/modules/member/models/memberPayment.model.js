import mongoose from "mongoose";

const memberPaymentSchema = new mongoose.Schema(
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
    teacher:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"teacher"
    }
  },
  { timestamps: true }
);

export default memberPaymentSchema