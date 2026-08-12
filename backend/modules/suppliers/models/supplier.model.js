import mongoose from "mongoose";

/**
 * Supplier Schema
 * Defines the structure for companies or individuals who provide products.
 */
const supplierSchema = new mongoose.Schema(
    {
        // The legal or trade name of the supplier
        name: {
            type: String,
            trim: true,
        },
        contactPerson: {
            type: String,
            trim: true,
        },
        // Type of supplier
        type: {
            type: String,
            enum: ["Distributor", "Wholesaler", "Manufacturer", "Other"],
            default: "Other",
        },
        // Contact email address
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please add a valid email",
            ],
        },
        // Contact phone number
        phone: {
            type: String,
            trim: true,
        },
        // Physical or billing address
        address: {
            type: String,
            trim: true,
        },
        // Additional notes about the supplier
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        // Supplier image/logo
        image: {
            type: String,
            default: null,
        },
        cloudinaryPublicId: {
            type: String,
        },
        // Status to toggle active/inactive suppliers without deleting records
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
        created: {
            type: Date,
            default: Date.now,
        },
        updated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

export default supplierSchema;
