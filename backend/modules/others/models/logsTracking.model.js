import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    model: { type: String},
    date: { type: Date, default: Date.now },
    action: { type: String}, 
    description: { type: String, default: "" },
    documentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    changedBy: {type:String, default: "Human"}, // for storing name/email of user who made the change, in case performedBy is null (e.g., for system-generated logs)
    
    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// activityLogSchema.index({ collection: 1 });
// activityLogSchema.index({ action: 1 });
// activityLogSchema.index({ documentId: 1 });
// activityLogSchema.index({ performedBy: 1 });
// activityLogSchema.index({ createdAt: -1 });

export default activityLogSchema;