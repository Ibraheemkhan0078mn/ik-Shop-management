import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { initializeImageMagick, ImageMagick, DitherMethod, MagickFormat, QuantizeSettings } from "@imagemagick/magick-wasm";
import { uploadDir } from "../../../common/services/uploadDirectory.js";

const MAX_IMAGE_SIZE = 200 * 1024;
const MAX_DIMENSION = 1600;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const QUALITY_LEVELS = [82, 72, 62, 52, 42];
const PNG_COLOR_LEVELS = [256, 192, 128, 64, 32];
const MIN_DIMENSION = 320;
const moduleRequire = createRequire(process.argv[1] || path.join(process.cwd(), "index.js"));
let imageMagickInitialization;

async function initializeImageMagickOnce() {
    if (!imageMagickInitialization) {
        imageMagickInitialization = (async () => {
            const wasmPath = moduleRequire.resolve("@imagemagick/magick-wasm/magick.wasm");
            const wasm = await fs.promises.readFile(wasmPath);
            await initializeImageMagick(wasm);
        })();
    }

    await imageMagickInitialization;
}

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

        await initializeImageMagickOnce();
        const imageBuffer = await fs.promises.readFile(imagePath);
        const optimizedBuffer = ImageMagick.read(imageBuffer, (sourceImage) => {
            sourceImage.autoOrient();
            const width = sourceImage.width;
            const height = sourceImage.height;
            const formatName = String(sourceImage.format).toUpperCase();
            const outputFormat = {
                JPEG: MagickFormat.Jpeg,
                JPG: MagickFormat.Jpeg,
                PNG: MagickFormat.Png,
                WEBP: MagickFormat.WebP,
            }[formatName];

            if (!width || !height || !outputFormat) {
                throw new Error(`Cannot optimize unsupported image: ${entry.name}`);
            }

            let scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
            while (Math.max(width, height) * scale >= MIN_DIMENSION) {
                for (let qualityIndex = 0; qualityIndex < QUALITY_LEVELS.length; qualityIndex++) {
                    const candidate = sourceImage.clone((image) => {
                        image.resize(
                            Math.max(1, Math.round(width * scale)),
                            Math.max(1, Math.round(height * scale))
                        );
                        image.quality = QUALITY_LEVELS[qualityIndex];
                        if (outputFormat === MagickFormat.Png) {
                            const quantizeSettings = new QuantizeSettings();
                            quantizeSettings.colors = PNG_COLOR_LEVELS[qualityIndex];
                            quantizeSettings.ditherMethod = DitherMethod.FloydSteinberg;
                            image.quantize(quantizeSettings);
                        }
                        return image.write(outputFormat, (data) => Buffer.from(data));
                    });

                    if (candidate.length < MAX_IMAGE_SIZE) {
                        return candidate;
                    }
                }

                scale *= 0.85;
            }
            return null;
        });

        if (!optimizedBuffer) {
            throw new Error(`Unable to reduce ${entry.name} below 200 KB without excessive resizing`);
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
