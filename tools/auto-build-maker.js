const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');
const frontendSrcDir = path.join(frontendDir, 'src');
const backendDistDir = path.join(backendDir, 'dist');
const backendExeInFrontend = path.join(frontendSrcDir, 'backend.exe');
const frontendPackageJson = path.join(frontendDir, 'package.json');

function log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`Removed: ${dirPath}`);
    } else {
        log(`Directory not found (skipping): ${dirPath}`);
    }
}

function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log(`Removed: ${filePath}`);
    } else {
        log(`File not found (skipping): ${filePath}`);
    }
}

function runCommand(command, cwd) {
    log(`Running: ${command}`);
    try {
        execSync(command, { cwd, stdio: 'inherit' });
        log(`Command completed successfully`);
    } catch (error) {
        log(`Command failed: ${error.message}`);
        throw error;
    }
}

function updateVersion() {
    const packageJson = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Increment version (patch version)
    const versionParts = currentVersion.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1;
    const newVersion = versionParts.join('.');
    
    packageJson.version = newVersion;
    fs.writeFileSync(frontendPackageJson, JSON.stringify(packageJson, null, 2));
    
    log(`Updated version from ${currentVersion} to ${newVersion}`);
    return newVersion;
}

function copyBackendExe() {
    // Find backend.exe in dist folder
    const distFiles = fs.readdirSync(backendDistDir);
    const exeFile = distFiles.find(file => file.endsWith('.exe'));
    
    if (exeFile) {
        const sourcePath = path.join(backendDistDir, exeFile);
        const destPath = backendExeInFrontend;
        
        fs.copyFileSync(sourcePath, destPath);
        log(`Copied ${exeFile} to ${destPath}`);
    } else {
        throw new Error('backend.exe not found in dist folder');
    }
}

async function main() {
    try {
        log('=== Auto Build Maker Started ===');
        
        // Step 1: Remove dist folder from backend if present
        log('Step 1: Removing dist folder from backend...');
        removeDirectory(backendDistDir);
        
        // Step 2: Remove backend.exe from frontend/src if present
        log('Step 2: Removing backend.exe from frontend/src...');
        removeFile(backendExeInFrontend);
        
        // Step 3: Run npm run build in backend
        log('Step 3: Building backend...');
        runCommand('npm run build', backendDir);
        
        // Step 4: Copy backend.exe to frontend/src
        log('Step 4: Copying backend.exe to frontend/src...');
        copyBackendExe();
        
        // Step 5: Update version in frontend package.json
        log('Step 5: Updating frontend version...');
        const newVersion = updateVersion();
        
        // Step 6: Run npm run build:github in frontend
        log('Step 6: Building frontend for GitHub...');
        runCommand('npm run build:github', frontendDir);
        
        // Step 7: Remove dist folder from backend
        log('Step 7: Removing dist folder from backend...');
        removeDirectory(backendDistDir);
        
        log('=== Auto Build Maker Completed Successfully ===');
        log(`New version: ${newVersion}`);
        
    } catch (error) {
        log(`=== Auto Build Maker Failed ===`);
        log(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
