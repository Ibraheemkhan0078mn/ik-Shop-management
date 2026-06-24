import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
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
            dashboard: { type: Boolean, default: false },
            pos: { type: Boolean, default: false },
            products: { type: Boolean, default: false },
            purchases: { type: Boolean, default: false },
            expenses: { type: Boolean, default: false },
            reports: { type: Boolean, default: false },
            accounts: { type: Boolean, default: false },
            staff: { type: Boolean, default: false },
            manageUsers: { type: Boolean, default: false },
            settings: { type: Boolean, default: false },
        },
        language: { type: String, enum: ["en", "ur"], default: "en" },
        uploadSync: {
            type: Boolean,
            default: true,
        },
        created: { type: Date, default: Date.now },
        updated: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export default userSchema;
