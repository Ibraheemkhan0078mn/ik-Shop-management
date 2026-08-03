import fs from "fs";
import path from "path";
import { uploadDir } from "../../../common/services/uploadDirectory.js";

/**
 * Safely remove a previously stored product image file from the uploads
 * directory. Silently ignores missing/invalid filenames so callers don't
 * need to pre-check.
 *
 * @param {string|null|undefined} filename - just the filename (as stored in product.image)
 */
export const deleteProductImage = (filename) => {
    if (!filename || typeof filename !== "string") return;
    // Reject anything that looks like a path — we only ever store bare filenames.
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;

    const fullPath = path.join(uploadDir, filename);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        // Non-fatal — log and move on. We never want a stale-file cleanup
        // to fail the user's create/update request.
        console.warn(`[productImage] could not delete ${filename}:`, err.message);
    }
};
