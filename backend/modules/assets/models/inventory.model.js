import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },
    itemCode: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      default: "non-consumable",
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Quantity ────────────────────────────────────────────────────────────
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    inUseQuantity: {
      type: Number,
      default: 0,
    },
    damagedQuantity: {
      type: Number,
      default: 0,
    },
    minimumThreshold: {
      type: Number,
      default: 0, // alert when availableQuantity <= this
    },

    // ── Location ────────────────────────────────────────────────────────────
    location: {
      room: { type: String, default: null },
      building: { type: String, default: null },
    },
    assignedTo: {
      type: String,
      default: null, // e.g. "Class 10A", "Science Lab", "Teacher: Ali"
    },

    // ── Purchase Info ───────────────────────────────────────────────────────
    purchaseDate: {
      type: Date,
      default: null,
    },
    vendor: {
      type: String,
      trim: true,
      default: null,
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    invoiceNumber: {
      type: String,
      default: null,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },

    // ── Condition & Maintenance ─────────────────────────────────────────────
    condition: {
      type: String,
      default: "new",
    },
    lastInspectionDate: {
      type: Date,
      default: null,
    },
    nextMaintenanceDate: {
      type: Date,
      default: null,
    },

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      default: "active",
    },
    disposalDate: {
      type: Date,
      default: null,
    },
    disposalReason: {
      type: String,
      default: null,
    },

    // ── Added by ────────────────────────────────────────────────────────────
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

// inventorySchema.index({ category: 1 });
// inventorySchema.index({ status: 1 });
// inventorySchema.index({ name: "text", description: "text" });

export default inventorySchema;