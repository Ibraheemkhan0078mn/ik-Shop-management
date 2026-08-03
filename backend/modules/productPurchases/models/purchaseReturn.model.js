// backend/modules/productPurchases/models/purchaseReturn.model.js
import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
  {
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchases", required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batches", required: true },
        quantity: { type: Number, required: true, min: 1 },
        cut: { type: Number, default: 0 }, // additional field as per requirement
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default purchaseReturnSchema;
