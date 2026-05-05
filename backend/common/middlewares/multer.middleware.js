import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";

// Get user home directory
const homeDir = os.homedir();

// Cross-platform app data directory
let appDataDir;

switch (process.platform) {
  case "win32":
    appDataDir = path.join(homeDir, "AppData", "Local", "SSIB");
    break;
  case "darwin": // macOS
    appDataDir = path.join(
      homeDir,
      "Library",
      "Application Support",
      "SSIB"
    );
    break;
  case "linux":
    appDataDir = path.join(homeDir, ".local", "share", "SSIB");
    break;
  default:
    appDataDir = path.join(homeDir, "SSIB");
}

// Uploads folder inside app data
const uploadDir = path.join(appDataDir, "uploads");

// Ensure the folder exists
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file?.originalname?.trim();
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only png, jpg, jpeg are allowed!"), false);
  }
};

// Export multer upload
export const upload = multer({ storage, fileFilter });
