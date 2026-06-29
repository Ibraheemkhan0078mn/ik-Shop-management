import multer from "multer";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { uploadDir } from "../services/uploadDirectory.js";

const isDeployed = process.env.SERVING_TYPE === "deployed";

// ─── Cloudinary Storage (deployed) ───────────────────────────────────────────
let storage;

if (isDeployed) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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

export const upload = multer({ storage, fileFilter });







// import multer from "multer";
// import fs from "fs";
// import path from "path";
// import { uploadDir } from "../services/uploadDirectory.js";

// // Ensure the uploads folder exists. `uploadDir` is the single source of
// // truth — same folder is statically served at /uploads in index.js.
// fs.mkdirSync(uploadDir, { recursive: true });

// // Multer storage — write into the shared uploads directory.
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file?.originalname || "").toLowerCase();
//     const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
//     cb(null, uniqueName);
//   },
// });

// // Only allow image types.
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only png, jpg, jpeg, webp are allowed!"), false);
//   }
// };

// export const upload = multer({ storage, fileFilter });
