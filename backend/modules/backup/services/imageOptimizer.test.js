import fs from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { optimizeImagesForSync } from "./imageOptimizer.js";

describe("optimizeImagesForSync", () => {
    let directory;

    beforeEach(async () => {
        directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "image-optimizer-"));
    });

    afterEach(async () => {
        await fs.promises.rm(directory, { recursive: true, force: true });
    });

    test("reduces oversized images below 500 KB and leaves smaller files unchanged", async () => {
        const oversizedPath = path.join(directory, "large.jpg");
        const smallPath = path.join(directory, "small.jpg");
        const noise = randomBytes(2400 * 1800 * 3);
        await sharp(noise, { raw: { width: 2400, height: 1800, channels: 3 } })
            .jpeg({ quality: 95 })
            .toFile(oversizedPath);
        await sharp({ create: { width: 32, height: 32, channels: 3, background: "red" } })
            .jpeg()
            .toFile(smallPath);
        const smallImageBefore = await fs.promises.readFile(smallPath);

        const result = await optimizeImagesForSync(directory);

        expect(result).toEqual({ optimized: 1, skipped: 1 });
        expect((await fs.promises.stat(oversizedPath)).size).toBeLessThan(500 * 1024);
        expect((await sharp(oversizedPath).metadata()).width).toBeLessThan(2400);
        expect(await fs.promises.readFile(smallPath)).toEqual(smallImageBefore);
    }, 30000);
});
