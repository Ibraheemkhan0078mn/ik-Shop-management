import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    cnic: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['cashier', 'tailor', 'stockKeeper', 'other'],
        default: 'other'
    },
    salaryType: {
        type: String,
        required: true,
        enum: ['fixed', 'percentage'],
        default: 'fixed'
    },
    joinDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    address: {
        type: String,
        trim: true
    },
    emergencyContact: {
        type: String,
        trim: true
    },
    photo: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    monthlySalary: {
        type: Number,
        default: 0
    },
    documents: [{
        documentType: {
            type: String,
            required: true,
            trim: true
        },
        filePath: {
            type: String,
            required: true,
            trim: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

export default staffSchema;
