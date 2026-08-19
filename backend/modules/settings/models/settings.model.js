import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
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
            posDirectPrint: {
                type: Boolean,
                default: false,
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
        // Permission Password Settings
        permissionPassword: {
            type: String,
            default: "",
        },
        // Backup Settings
        backup: {
            syncIntervalValue: {
                type: Number,
                default: 4, // default value
            },
            syncIntervalUnit: {
                type: String,
                enum: ['seconds', 'minutes', 'hours', 'days'],
                default: 'hours',
            },
            excelBackupPath: {
                type: String,
                default: "./backups/excel",
            },
        },
        // Zoom Settings
        zoom: {
            type: Number,
            default: 1.0, // default zoom level (100%)
            min: 0.5, // 50%
            max: 2.0, // 200%
        },
        // Sync Fields
        createdTimeForSync: { type: Date, default: Date.now },
        updateTimeForSync: { type: Date, default: Date.now },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default settingsSchema;
