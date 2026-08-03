import { exec } from 'child_process';
import { copyFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting build process...');

// Step 1: Run babel transpilation
console.log('📦 Step 1: Transpiling with Babel...');
exec('npm run build:babel', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Babel transpilation failed:', error);
    process.exit(1);
  }
  console.log('✅ Babel transpilation completed');
  console.log(stdout);

  // Step 2: Run pkg to create exe
  console.log('🔧 Step 2: Creating executable with pkg...');
  exec('npm run build:exe', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Exe creation failed:', error);
      process.exit(1);
    }
    console.log('✅ Executable created');
    console.log(stdout);

    // Step 3: Copy exe to frontend-desktop/desktop-setup/src
    const sourcePath = path.join(__dirname, 'dist', 'backend.exe');
    const targetPath = path.join(__dirname, '..', 'frontend-desktop', 'desktop-setup', 'src', 'backend.exe');
    
    console.log('📋 Step 3: Copying exe to frontend...');
    copyFile(sourcePath, targetPath)
      .then(() => {
        console.log('✅ Build and copy completed successfully!');
        console.log(`📁 Exe copied to: ${targetPath}`);
      })
      .catch((err) => {
        console.error('❌ Failed to copy exe:', err);
        process.exit(1);
      });
  });
});
