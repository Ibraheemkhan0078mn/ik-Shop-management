import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    permissions: {
        type: [String],
        default: []
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

export default userRoleSchema;
