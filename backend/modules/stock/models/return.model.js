// returnSchema
import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema({
    product:        { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    invoiceItem:    { type: mongoose.Schema.Types.ObjectId },                                  // ref to original invoice item (null if direct)
    batch:          { type: String },
    expiryDate:     { type: Date },
    originalQty:    { type: Number },                                                          // original invoice qty
    returnQuantity: { type: Number, required: true },
    condition:      { type: String, required: true },
    cut:            { type: Number, default: 0 },                                              // fixed amount cut per item
    costPrice:      { type: Number },
    refundAmount:   { type: Number },                                                          // auto: returnQuantity × costPrice - cut
    notes:          { type: String },
}, { _id: false });

const returnSchema = new mongoose.Schema({
    returnNumber:   { type: String, required: true, unique: true },                            // auto: RET-00001
    returnType:     { type: String, enum: ["invoice_based", "direct"] },
    invoice:        { type: mongoose.Schema.Types.ObjectId, ref: "Purchases" },                  // null if direct
    returnDate:     { type: Date, default: Date.now },
    returnReason:   { type: String },

    items:          [returnItemSchema],

    totalItems:     { type: Number, default: 0 },
    totalQuantity:  { type: Number, default: 0 },
    totalRefund:    { type: Number, default: 0 },

    status:         { type: String, default: "draft" },
    // approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt:     { type: Date },
    rejectionReason:{ type: String },

    // createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // updatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default returnSchema;