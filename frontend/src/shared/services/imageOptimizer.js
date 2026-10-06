import imageCompression from "browser-image-compression";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXTENSIONS_BY_TYPE = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export async function optimizeImage(image, { targetSizeKB = 200, maxWidthOrHeight = 1920 } = {}) {
    if (!image || typeof image.size !== "number" || typeof image.type !== "string" || typeof image.name !== "string") {
        throw new TypeError("A valid image file is required");
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
        throw new TypeError("Only JPG, PNG, and WebP images can be optimized");
    }
    if (!Number.isFinite(targetSizeKB) || targetSizeKB < 100 || targetSizeKB > 200) {
        throw new RangeError("The target image size must be between 100 and 200 KB");
    }
    if (!Number.isFinite(maxWidthOrHeight) || maxWidthOrHeight < 1) {
        throw new RangeError("The maximum image dimension must be a positive number");
    }

    const targetBytes = targetSizeKB * 1024;
    if (image.size <= targetBytes) return image;

    const outputType = image.type === "image/png" ? "image/webp" : image.type;
    const compressedImage = await imageCompression(image, {
        maxSizeMB: (targetBytes * 0.98) / (1024 * 1024),
        maxWidthOrHeight,
        maxIteration: 15,
        initialQuality: 0.9,
        fileType: outputType,
        useWebWorker: false,
        preserveExif: false,
    });

    if (compressedImage.size > targetBytes) {
        throw new Error(`The image could not be reduced to ${targetSizeKB} KB without excessive quality loss`);
    }

    const baseName = image.name.replace(/\.[^/.]+$/, "");
    const extension = EXTENSIONS_BY_TYPE[outputType];

    return new File([compressedImage], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: image.lastModified,
    });
}
