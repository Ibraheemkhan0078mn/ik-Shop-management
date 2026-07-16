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
        // Status to toggle active/inactive suppliers without deleting records
        isActive: {
            type: Boolean,
            default: true,
        },
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
