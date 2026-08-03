import path from "path";
import os from "os";
import fs from "fs";

// ───────────────────────────────────────────────────────────────────
// Single source of truth for the uploads directory.
//
// Used by:
//   • multer.middleware.js   → where files are written
//   • index.js               → where /uploads is statically served from
//   • product image cleanup  → deleting the previous image on update
//
// Keep this in sync everywhere — never hardcode the folder path again.
// ───────────────────────────────────────────────────────────────────

// Use Windows AppData Local directory for ik-shop-management
const appDataPath = path.join(os.homedir(), 'AppData', 'Local');
export const uploadDir = path.join(appDataPath, 'ik-shop-management');

// Ensure directory exists
try {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory:', uploadDir);
} catch (error) {
  console.error('Failed to create upload directory:', error.message);
}
