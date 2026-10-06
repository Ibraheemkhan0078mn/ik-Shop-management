import fs from "fs";
import path from "path";
import sharp from "sharp";
import { uploadDir } from "../../../common/services/uploadDirectory.js";

const MAX_IMAGE_SIZE = 200 * 1024;
const MAX_DIMENSION = 1600;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const QUALITY_LEVELS = [82, 72, 62, 52, 42];
const MIN_DIMENSION = 320;

export async function optimizeImagesForSync(directory = uploadDir) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    const stats = { optimized: 0, skipped: 0 };

    for (const entry of entries) {
        if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            continue;
        }

        const imagePath = path.join(directory, entry.name);
        const fileStats = await fs.promises.stat(imagePath);
        if (fileStats.size <= MAX_IMAGE_SIZE) {
            stats.skipped++;
            continue;
        }

        const metadata = await sharp(imagePath).metadata();
        if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format)) {
            throw new Error(`Cannot optimize unsupported image: ${entry.name}`);
        }

        let scale = Math.min(1, MAX_DIMENSION / Math.max(metadata.width, metadata.height));
        let optimizedBuffer;

        while (!optimizedBuffer && Math.max(metadata.width, metadata.height) * scale >= MIN_DIMENSION) {
            for (const quality of QUALITY_LEVELS) {
                let image = sharp(imagePath)
                    .rotate()
                    .resize({
                        width: Math.max(1, Math.round(metadata.width * scale)),
                        height: Math.max(1, Math.round(metadata.height * scale)),
                        fit: "inside",
                        withoutEnlargement: true,
                    });

                if (metadata.format === "jpeg") {
                    image = image.jpeg({ quality, mozjpeg: true });
                } else if (metadata.format === "webp") {
                    image = image.webp({ quality });
                } else {
                    image = image.png({ palette: true, quality, effort: 10 });
                }

                const candidate = await image.toBuffer();
                if (candidate.length < MAX_IMAGE_SIZE) {
                    optimizedBuffer = candidate;
                    break;
                }
            }

            scale *= 0.85;
        }

        if (!optimizedBuffer) {
            throw new Error(`Unable to reduce ${entry.name} below 500 KB without excessive resizing`);
        }

        const temporaryPath = `${imagePath}.${process.pid}.tmp`;
        try {
            await fs.promises.writeFile(temporaryPath, optimizedBuffer);
            await fs.promises.rename(temporaryPath, imagePath);
        } catch (error) {
            await fs.promises.rm(temporaryPath, { force: true });
            throw new Error(`Failed to save optimized image ${entry.name}: ${error.message}`);
        }

        stats.optimized++;
        console.log(`Optimized ${entry.name}: ${fileStats.size} -> ${optimizedBuffer.length} bytes`);
    }

    return stats;
}
