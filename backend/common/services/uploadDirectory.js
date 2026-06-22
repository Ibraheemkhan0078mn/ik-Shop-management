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
const homeDir = os.homedir();

let appDataDir;
switch (process.platform) {
  case "win32":
    appDataDir = path.join(homeDir, "AppData", "Local", "ik-shop-desktop");
    break;
  case "darwin":
    appDataDir = path.join(homeDir, "Library", "Application Support", "ik-shop-desktop");
    break;
  case "linux":
    appDataDir = path.join(homeDir, ".local", "share", "ik-shop-desktop");
    break;
  default:
    appDataDir = path.join(homeDir, "ik-shop-desktop");
}

export const uploadDir = appDataDir;
