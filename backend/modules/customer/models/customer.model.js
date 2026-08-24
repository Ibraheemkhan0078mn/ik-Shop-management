import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
        },
        image: {
            type: String,
            trim: true,
            default: "",
        },
        cloudinaryPublicId: {
            type: String,
        },
        phoneNo: {
            type: String,
            trim: true,
            sparse: true,
        },
        cnic: {
            type: String,
            trim: true,
            sparse: true,
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        customerType: {
            type: String,
            enum: ["walkin", "regular"],
            default: "walkin",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Associated qarza account for credits/debits
        qarzaAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QarzaAccount",
        },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    },
);

export default customerSchema;
