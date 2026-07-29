import path from "path";
import os from "os";

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

// Use project root uploads directory for better accessibility
const projectRoot = process.cwd();
export const uploadDir = path.join(projectRoot, "uploads");
