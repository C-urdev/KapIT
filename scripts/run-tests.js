import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const testsRoot = path.join(repoRoot, 'backend', 'api', 'tests');

const collectTestFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.cjs')) {
      files.push(fullPath);
    }
  }

  return files;
};

if (!fs.existsSync(testsRoot)) {
  console.error(`Tests directory not found: ${path.relative(repoRoot, testsRoot)}`);
  process.exit(1);
}

const testFiles = collectTestFiles(testsRoot).sort();
if (testFiles.length === 0) {
  console.error(`No test files found under ${path.relative(repoRoot, testsRoot)}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

console.error(result.error?.message || 'Test runner failed without an exit status');
process.exit(1);
