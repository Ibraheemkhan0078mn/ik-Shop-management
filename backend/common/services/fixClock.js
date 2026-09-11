// fix-clock-sync.js
// Run with: node fix-clock-sync.js
// Must be run from an Administrator terminal (Node itself can't elevate)
// package.json must have: { "type": "module" }

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCmd(cmd, label) {
  console.log(`\n${label}...`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.log(stderr.trim());
  } catch (err) {
    console.error(`Failed: ${err.message}`);
  }
}

async function fixClockSync() {
  await runCmd('net stop w32time', 'Stopping Windows Time service');
  await runCmd('w32tm /unregister', 'Unregistering time service');
  await runCmd('w32tm /register', 'Registering time service');
  await runCmd('net start w32time', 'Starting Windows Time service');
  await runCmd(
    'w32tm /config /manualpeerlist:"time.windows.com,0x8 time.google.com,0x8" /syncfromflags:manual /reliable:yes /update',
    'Setting time servers'
  );
  await runCmd('w32tm /resync /force', 'Forcing resync');

  console.log(`\nDone. Current system time: ${new Date().toString()}`);
}

export { fixClockSync };