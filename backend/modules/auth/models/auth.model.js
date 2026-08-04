import mongoose from "mongoose";
import { encrypt, comparePassword } from "../../../common/utils/encryption.util.js";
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
        photo: {
            type: String,
            default: "",
        },
        language: { type: String, enum: ["en", "ur"], default: "en" },
        uploadSync: {
            type: Boolean,
            default: true,
        },
        // Soft Delete Fields
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
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
    this.password = encrypt(this.password);
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return comparePassword(candidatePassword, this.password);
};

export default userSchema;
