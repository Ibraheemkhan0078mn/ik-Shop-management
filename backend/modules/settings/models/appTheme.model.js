import mongoose from "mongoose";

const appThemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: "Default Theme" },
    isActive: { type: Boolean, default: false },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: false, index: true },
    colors: {
      appBg: { type: String, default: null },
      appBg2: { type: String, default: null },
      surface: { type: String, default: null },
      surfaceMuted: { type: String, default: null },
      ink: { type: String, default: null },
      muted: { type: String, default: null },
      accent: { type: String, default: null },
      accent2: { type: String, default: null },
      border: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default appThemeSchema
