import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        created: { type: Date, default: Date.now },
        updated: { type: Date },
    },
    { timestamps: true },
);

export default categorySchema;
