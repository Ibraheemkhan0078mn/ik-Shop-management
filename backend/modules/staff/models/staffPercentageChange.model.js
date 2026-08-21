import mongoose from "mongoose";

const staffPercentageChangeSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    percentageChangeFromDate: {
        type: Date,
        required: true
    },
    percentage: {
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

// Index for efficient querying of percentage changes by staff and date
staffPercentageChangeSchema.index({ staffId: 1, percentageChangeFromDate: 1 });

export default staffPercentageChangeSchema;
