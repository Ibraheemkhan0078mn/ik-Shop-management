import multer from "multer";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { uploadDir } from "../services/uploadDirectory.js";
import { SERVING_TYPE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../constants/env.js";

const isDeployed = SERVING_TYPE === "deployed";

// ─── Cloudinary Storage (deployed) ───────────────────────────────────────────
let storage;

if (isDeployed) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const ext = path.extname(file?.originalname || "").toLowerCase().replace(".", "");
      return {
        folder: "ik-shop",
        allowed_formats: ["png", "jpg", "jpeg", "webp"],
        public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        format: ext || "webp",
      };
    },
  });

  // ─── Disk Storage (local) ─────────────────────────────────────────────────────
} else {
  fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file?.originalname || "").toLowerCase();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      cb(null, uniqueName);
    },
  });
}

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only png, jpg, jpeg, webp are allowed!"), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  }
});


