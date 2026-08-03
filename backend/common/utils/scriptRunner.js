import { spawn } from 'child_process';
import { resolve } from 'path';
import { platform } from 'os';

export function elevate(scriptPaths = []) {
  const absPaths = scriptPaths.map(p => resolve(p));

  return new Promise((res, rej) => {
    let child;

    if (platform() === 'win32') {
      const commands = absPaths.map(p => `node "${p}"`).join(' && ');
      const ps = `Start-Process cmd -ArgumentList '/k ${commands}' -Verb RunAs -Wait`;
      child = spawn('powershell.exe', ['-Command', ps], { stdio: 'inherit' });

    } else if (platform() === 'darwin' || platform() === 'linux') {
      const commands = absPaths.map(p => `node "${p}"`).join(' && ');
      child = spawn('sudo', ['bash', '-c', commands], { stdio: 'inherit' });

    } else {
      return rej(new Error(`Unsupported platform: ${platform()}`));
    }

    child.on('close', (code) => {
      if (code === 0) res();
      else rej(new Error(`Exited with code ${code}`));
    });

    child.on('error', rej);
  });
}