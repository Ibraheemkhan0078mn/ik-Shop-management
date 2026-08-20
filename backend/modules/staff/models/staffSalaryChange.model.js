import mongoose from "mongoose";

const staffSalaryChangeSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    absenceCut: {
        type: Number,
        default: 0
    },
    isAbsenceCut: {
        type: Boolean,
        default: false
    },
    absenceCutType: {
        type: String,
        enum: ['full', 'amount'],
        default: 'full'
    },
    salaryChangeFromDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    changeType: {
        type: String,
        enum: ['inc', 'decr', 'set'],
        required: true
    },
    notes: {
        type: String
    },
    // Sync Fields
    createdTimeForSync: { type: Date, default: Date.now },
    updateTimeForSync: { type: Date, default: Date.now },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

// Index for efficient querying of salary changes by staff and date
staffSalaryChangeSchema.index({ staffId: 1, salaryChangeFromDate: 1 });

export default staffSalaryChangeSchema;
