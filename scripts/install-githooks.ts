import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gitDir = path.join(repoRoot, '.git');
const hooksDir = path.join(repoRoot, '.githooks');

if (!fs.existsSync(gitDir)) {
  process.exit(0);
}

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  console.log('Configured git hooks path: .githooks');
} catch (error: unknown) {
  console.warn('Warning: could not configure git hooks path automatically.');
  console.warn(String(error instanceof Error ? error.message : error));
}
