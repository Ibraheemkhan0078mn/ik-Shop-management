import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        // Printer Settings
        printer: {
            height: {
                type: Number,
                default: 300, // mm
            },
            width: {
                type: Number,
                default: 80, // mm
            },
            printMode: {
                type: String,
                enum: ["preview", "direct"],
                default: "preview",
            },
        },
        // Language Settings
        language: {
            type: String,
            enum: ["en", "ur", "en-ur"],
            default: "en",
        },
        // Camera Settings
        camera: {
            selectedDeviceId: {
                type: String,
                default: "",
            },
            deviceName: {
                type: String,
                default: "",
            },
        },
        // Shop Settings
        shop: {
            name: {
                type: String,
                default: "",
            },
            imageUrl: {
                type: String,
                default: "",
            },
        },
        // Module Visibility Settings
        modules: {
            dashboard: { type: Boolean, default: true },
            pos: { type: Boolean, default: true },
            products: { type: Boolean, default: true },
            purchases: { type: Boolean, default: true },
            sales: { type: Boolean, default: true },
            customers: { type: Boolean, default: true },
            suppliers: { type: Boolean, default: true },
            expenses: { type: Boolean, default: true },
            reports: { type: Boolean, default: true },
            accounts: { type: Boolean, default: true },
            qarza: { type: Boolean, default: true },
            staff: { type: Boolean, default: true },
            wastage: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

export default settingsSchema;
