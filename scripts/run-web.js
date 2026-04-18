import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

// Load local overrides first, then base .env as fallback values.
// This keeps explicit shell/env-platform variables as highest priority.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const scriptName = process.argv[2] || 'dev';
const appDirectory = path.resolve(process.cwd(), 'apps/web');
const nextHost = process.env.NEXTJS_HOST;
const nextPort = process.env.NEXTJS_PORT || '3000';
const hideNetworkLine = process.env.HIDE_NEXT_NETWORK_LINE === 'true';
const quietStartup = process.env.QUIET_STARTUP === 'true';
const hideRequestLines = scriptName === 'dev' && process.env.HIDE_NEXT_REQUEST_LINES !== 'false';
const forceCleanNextDev = process.env.FORCE_CLEAN_NEXT_DEV !== 'false';
const useTurbopack = scriptName === 'dev' && process.env.NEXT_USE_TURBOPACK !== 'false';
const nextBin = path.resolve(appDirectory, 'node_modules', 'next', 'dist', 'bin', 'next');
const command = process.execPath;
const args = [nextBin, scriptName];

if (scriptName === 'dev' && forceCleanNextDev) {
  fs.rmSync(path.join(appDirectory, '.next'), { recursive: true, force: true });
}

if (scriptName === 'dev' || scriptName === 'start') {
  args.push('-p', nextPort);

  if (nextHost) {
    args.push('-H', nextHost);
  }
}

if (useTurbopack) {
  args.push('--turbopack');
}

const { PORT: _ignoredPort, HOST: _ignoredHost, ...forwardedEnv } = process.env;
const normalizedNodeEnv =
  scriptName === 'build' ? 'production' : scriptName === 'dev' ? 'development' : process.env.NODE_ENV;
const spawnStdio = hideNetworkLine || quietStartup || hideRequestLines ? ['ignore', 'pipe', 'pipe'] : 'inherit';

const spawnOptions = {
  cwd: appDirectory,
  env: {
    ...forwardedEnv,
    ...(normalizedNodeEnv ? { NODE_ENV: normalizedNodeEnv } : {}),
    PORT: nextPort,
    ...(nextHost ? { HOST: nextHost } : {}),
    INIT_CWD: appDirectory,
    npm_config_local_prefix: appDirectory,
  },
  stdio: spawnStdio,
  shell: false,
};

const ensureDeterministicRoutesManifest = () => {
  if (scriptName !== 'build') {
    return;
  }

  const nextDirectory = path.join(appDirectory, '.next');
  const sourceManifest = path.join(nextDirectory, 'routes-manifest.json');
  const deterministicManifest = path.join(nextDirectory, 'routes-manifest-deterministic.json');

  if (fs.existsSync(deterministicManifest) || !fs.existsSync(sourceManifest)) {
    return;
  }

  fs.copyFileSync(sourceManifest, deterministicManifest);
  console.log('Created .next/routes-manifest-deterministic.json');
};

let child;
try {
  child = spawn(command, args, spawnOptions);
} catch (error) {
  const canRetryWithShell =
    process.platform === 'win32' && (error?.code === 'EINVAL' || error?.code === 'EPERM');

  if (!canRetryWithShell) {
    throw error;
  }

  child = spawn(command, args, {
    ...spawnOptions,
    shell: true,
  });
}

if (hideNetworkLine || quietStartup || hideRequestLines) {
  const requestLogPattern = /^\s*(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+\/\S+\s+\d{3}\s+in\s+\d+ms/i;

  const shouldSkipLine = (line) => {
    if (hideNetworkLine && line.includes('- Network:')) {
      return true;
    }

    if (hideRequestLines && requestLogPattern.test(line.trim())) {
      return true;
    }

    if (quietStartup) {
      if (!line.trim()) {
        return true;
      }

      if (line.includes('- Environments:')) {
        return true;
      }

      if (line.includes('- Experiments')) {
        return true;
      }

      if (line.includes('devtoolSegmentExplorer')) {
        return true;
      }

      if (line.includes('externalDir')) {
        return true;
      }
    }

    return false;
  };

  const forward = (stream, target) => {
    let buffer = '';

    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (shouldSkipLine(line)) {
          continue;
        }

        target.write(`${line}\n`);
      }
    });

    stream.on('end', () => {
      if (buffer && !shouldSkipLine(buffer)) {
        target.write(buffer);
      }
    });
  };

  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
}

child.on('error', (error) => {
  console.error(`Failed to start Next.js process: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  if ((code ?? 0) === 0) {
    ensureDeterministicRoutesManifest();
  }

  process.exit(code ?? 0);
});

