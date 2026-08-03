
import fs from "fs";
import path from "path";
import { execSync } from "child_process"; 

// Project root (where package.json exists)
const projectRoot = process.cwd();

// Paths (RELATIVE TO BACKEND ROOT)
const distDir = path.join(projectRoot, "dist");
const backendExe = path.join(distDir, "backend.exe");

// Frontend destination
const frontendExe = path.join(
    projectRoot,
    "../frontend/src/backend.exe"
);

function log(msg) {
    console.log(`✔ ${msg}`);
}

function run(cmd) {
    execSync(cmd, { stdio: "inherit" });
}

try {
    // 1️⃣ Delete backend dist folder
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
        log("Old backend dist folder removed");
    }

    // 2️⃣ Delete old frontend backend.exe
    if (fs.existsSync(frontendExe)) {
        fs.unlinkSync(frontendExe);
        log("Old frontend backend.exe removed");
    }

    // 3️⃣ Babel build (compile to dist/)
    log("Running Babel build...");
    run("npx babel . --out-dir dist --ignore node_modules");

    // 4️⃣ PKG build (create backend.exe)
    log("Running PKG build...");
    run(
        "npx pkg dist/server.js --targets node18-win-x64 --output dist/backend.exe"
    );

    // 5️⃣ Ensure frontend folder exists
    const frontendDir = path.dirname(frontendExe);
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    // 6️⃣ Copy backend.exe to frontend
    fs.copyFileSync(backendExe, frontendExe);
    log("backend.exe copied to frontend successfully");

    console.log("\n✅ BACKEND BUILD & TRANSFER COMPLETED SUCCESSFULLY");
} catch (error) {
    console.error("\n❌ BUILD FAILED");
    console.error(error.message);
    process.exit(1);
}
