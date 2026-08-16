import mongoose from "mongoose";
import { normalizePermissions } from "../utils/permission.utils.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phoneNo: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "manager", "staff"],
            default: "staff",
        },
        permissions: {
            type: [String],
            default: [],
            set: (value) => normalizePermissions(value),
        },
        photo: {
            type: String,
            default: "",
        },
        cloudinaryPublicId: {
            type: String,
        },
        language: { type: String, enum: ["en", "ur"], default: "en" },
        uploadSync: {
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
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export default userSchema;
