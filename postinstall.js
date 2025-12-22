import { existsSync, chmodSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';

if (platform() === 'win32') {
  process.exit(0); // Windows : rien à faire
}

const base = join(
  new URL('.', import.meta.url).pathname,
  '..',
  'lib',
  'scrcpy-v3.3.4',
  'linux'
);

const bins = ['scrcpy', 'scrcpy-server', 'adb'];

for (const b of bins) {
  const p = join(base, b);
  if (existsSync(p)) {
    try {
      chmodSync(p, 0o755);
    } catch {}
  }
}
