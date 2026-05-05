import mongoose from "mongoose";

const QarzaAccountSchema = new mongoose.Schema(
  {
    cloudinaryPublicId: {type: String},
    qarzaProfileImage:{type:String},
    name: { type: String, required: true },
    type: { type: String },
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
  },
  { timestamps: true }
);

export default QarzaAccountSchema;

