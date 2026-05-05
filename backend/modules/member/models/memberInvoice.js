import mongoose from "mongoose";
// import { modelTrackingForChangeTrackDocsCreation } from "../services/ModelTrackingForChangeTrackDocsCreation.js";

const memberInvoiceSchema = new mongoose.Schema(
  {
    teacherUniqueId: { type: String, required: true },

    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher", required: true },

    revenueType: { type: String, required: true },

    revenueReasonRecord: [{ type: String }],

    invoiceAmount: { type: Number, required: true },

    absence: { type: Number, default: 0 },

    absenceCut: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },

    remainingAmount: { type: Number, default: 0 },

    paidStatus: { type: String, required: true },

    paymentRecord: [
      {
        paymentId: { type: String, required: true },
        usedAmountByPayment: { type: Number, required: true },
        date: { type: Date, required: true },
      },
    ],

    invoiceGeneratedFor: { type: Date, required: true },
  },
  { timestamps: true }
);

//  modelTrackingForChangeTrackDocsCreation(memberInvoiceSchema)
export { memberInvoiceSchema };
