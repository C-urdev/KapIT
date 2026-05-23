// scripts/run-web.js – Vite launcher
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 1. Resolve paths & load environment variables
// ---------------------------------------------------------------------------
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

try {
  const dotenvModule = await import('dotenv');
  const dotenv = dotenvModule?.default || dotenvModule;
  dotenv.config({ path: path.resolve(repoRoot, '.env.local') });
  dotenv.config({ path: path.resolve(repoRoot, '.env') });
} catch (e) {
  if (String(e?.code ?? '') !== 'ERR_MODULE_NOT_FOUND') {
    console.warn('dotenv load skipped:', e.message);
  }
}

// ---------------------------------------------------------------------------
// 2. Script name (dev | build | start) – default to dev
// ---------------------------------------------------------------------------
const scriptName = process.argv[2] || 'dev';
const appDirectory = path.resolve(repoRoot, 'frontend');

const frontendHost = process.env.VITE_HOST || '127.0.0.1';
const frontendPort = process.env.VITE_PORT || '5173';

// ---------------------------------------------------------------------------
// 3. Build command & arguments for Vite
// ---------------------------------------------------------------------------
const viteBin = path.resolve(
  appDirectory,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);
const command = fs.existsSync(viteBin) ? viteBin : 'vite';
const viteMode = scriptName === 'build' ? 'build' : 'dev';
const args = [viteMode];

// ---------------------------------------------------------------------------
// 4. Spawn options (environment & stdio)
// ---------------------------------------------------------------------------
const normalizedNodeEnv =
  scriptName === 'build'
    ? 'production'
    : scriptName === 'dev'
    ? 'development'
    : process.env.NODE_ENV;

const spawnOptions = {
  cwd: appDirectory,
  env: {
    ...process.env,
    ...(normalizedNodeEnv ? { NODE_ENV: normalizedNodeEnv } : {}),
    VITE_PORT: frontendPort,
    VITE_HOST: frontendHost,
    INIT_CWD: appDirectory,
    npm_config_local_prefix: appDirectory,
  },
  stdio: 'inherit',
  shell: false,
};

// ---------------------------------------------------------------------------
// 5. Spawn the process
// ---------------------------------------------------------------------------
let child;
try {
  child = spawn(command, args, spawnOptions);
} catch (e) {
  const canRetry =
    process.platform === 'win32' &&
    (e?.code === 'EINVAL' || e?.code === 'EPERM');
  if (!canRetry) throw e;
  child = spawn(command, args, { ...spawnOptions, shell: true });
}

child.on('error', (err) => {
  console.error(`Failed to start Vite process: ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
