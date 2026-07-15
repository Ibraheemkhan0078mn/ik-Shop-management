import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizePermissions } from "../utils/permission.utils.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phoneNo: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "manager", "staff"],
            default: "staff",
        },
        permissions: {
            type: [String],
            default: [],
            set: (value) => normalizePermissions(value),
        },
        language: { type: String, enum: ["en", "ur"], default: "en" },
        uploadSync: {
            type: Boolean,
            default: true,
        },
        created: { type: Date, default: Date.now },
        updated: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default userSchema;
