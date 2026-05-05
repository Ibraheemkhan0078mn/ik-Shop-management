// admin-task.js
import { execSync } from 'child_process';

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

console.log('\n=============================');
console.log('  STARTING ADMIN TEST...');
console.log('=============================\n');
sleep(2000);

console.log('>> Creating folder at C:\\AdminTest...');
execSync('mkdir C:\\AdminTest', { stdio: 'inherit' });
sleep(2000);
console.log('   DONE.\n');

console.log('>> Writing file...');
execSync('echo Admin access confirmed! > C:\\AdminTest\\test.txt', { stdio: 'inherit' });
sleep(2000);
console.log('   DONE.\n');

console.log('>> Reading file content:');
console.log('----------------------------');
execSync('type C:\\AdminTest\\test.txt', { stdio: 'inherit' });
console.log('----------------------------\n');
sleep(2000);

console.log('>> Deleting everything...');
execSync('rmdir /s /q C:\\AdminTest', { stdio: 'inherit' });
sleep(2000);
console.log('   CLEANED UP.\n');

console.log('=============================');
console.log('  TEST PASSED. ADMIN WORKS.');
console.log('=============================\n');
sleep(3000);