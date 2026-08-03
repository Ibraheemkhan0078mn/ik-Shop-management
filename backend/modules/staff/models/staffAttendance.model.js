import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    attendance: [{
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            required: true
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'leave', 'late'],
            required: true
        },
        lateHours: {
            type: Number,
            default: 0
        },
        markedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

// Compound index for date to ensure only one attendance record per day
staffAttendanceSchema.index({ date: 1 }, { unique: true });

export default staffAttendanceSchema;
