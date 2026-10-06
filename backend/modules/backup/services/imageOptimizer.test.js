import fs from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";
import { createRequire } from "module";
import { initializeImageMagick, ImageMagick, MagickColors, MagickFormat } from "@imagemagick/magick-wasm";
import { optimizeImagesForSync } from "./imageOptimizer.js";

describe("optimizeImagesForSync", () => {
    let directory;

    beforeAll(async () => {
        const moduleRequire = createRequire(process.argv[1] || path.join(process.cwd(), "index.js"));
        const wasm = await fs.promises.readFile(moduleRequire.resolve("@imagemagick/magick-wasm/magick.wasm"));
        await initializeImageMagick(wasm);
    });

    beforeEach(async () => {
        directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "image-optimizer-"));
    });

    afterEach(async () => {
        await fs.promises.rm(directory, { recursive: true, force: true });
    }, 30000);

    test("reduces oversized JPEG, PNG, and WebP images below 200 KB and skips smaller files", async () => {
        const smallPath = path.join(directory, "small.jpg");
        const width = 900;
        const height = 700;
        const noise = randomBytes(width * height * 3);
        const ppm = Buffer.concat([
            Buffer.from(`P6\n${width} ${height}\n255\n`),
            noise,
        ]);
        const formats = [
            { extension: "jpg", format: MagickFormat.Jpeg },
            { extension: "png", format: MagickFormat.Png },
            { extension: "webp", format: MagickFormat.WebP },
        ];
        for (const { extension, format } of formats) {
            const imagePath = path.join(directory, `large.${extension}`);
            const image = ImageMagick.read(ppm, MagickFormat.Ppm, (sourceImage) =>
                sourceImage.write(format, (data) => Buffer.from(data))
            );
            await fs.promises.writeFile(imagePath, image);
        }

        const smallImage = ImageMagick.read(MagickColors.Red, 32, 32, (image) =>
            image.write(MagickFormat.Jpeg, (data) => Buffer.from(data))
        );
        await fs.promises.writeFile(smallPath, smallImage);
        const smallImageBefore = await fs.promises.readFile(smallPath);

        const result = await optimizeImagesForSync(directory);

        expect(result).toEqual({ optimized: formats.length, skipped: 1 });
        for (const { extension, format } of formats) {
            const imagePath = path.join(directory, `large.${extension}`);
            expect((await fs.promises.stat(imagePath)).size).toBeLessThan(200 * 1024);
            const optimizedImage = ImageMagick.read(
                await fs.promises.readFile(imagePath),
                (image) => ({ width: image.width, height: image.height, format: image.format })
            );
            expect(optimizedImage.width).toBeLessThanOrEqual(1600);
            expect(optimizedImage.height).toBeLessThanOrEqual(1600);
            expect(String(optimizedImage.format)).toBe(format);
        }
        expect(await fs.promises.readFile(smallPath)).toEqual(smallImageBefore);
    }, 120000);
});
