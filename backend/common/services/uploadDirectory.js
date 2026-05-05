import path from "path";
import os from "os";

const homeDir = os.homedir();

let appDataDir;
switch (process.platform) {
  case "win32":
    appDataDir = path.join(homeDir, "AppData", "Local", "SSIB");
    break;
  case "darwin":
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

export const uploadDir = path.join(appDataDir, "uploads");
