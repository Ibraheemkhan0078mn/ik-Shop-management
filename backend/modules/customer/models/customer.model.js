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
        phoneNo: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
        },
        cnic: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    },
);

export default customerSchema;
