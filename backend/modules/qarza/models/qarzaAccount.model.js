import mongoose from "mongoose";

const QarzaAccountSchema = new mongoose.Schema(
  {
    cloudinaryPublicId: {type: String},
    qarzaProfileImage:{type:String},
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['supplier', 'customer', 'general'],
      default: 'general'
    },
    phoneNo: { type: String },
    address: { type: String },
    notes: { type: String },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QarzaPayment"
      }
    ],
    isActive: { type: Boolean, default: true },
    
    // Sync Fields
    createdTimeForSync: { type: Date, default: Date.now },
    updateTimeForSync: { type: Date, default: Date.now },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default QarzaAccountSchema;

