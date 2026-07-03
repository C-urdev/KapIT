import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// ---------------------------------------------------------------------------
// Paths & environment
// ---------------------------------------------------------------------------
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local'), override: true });

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
let SERVER_PORT = Number(process.env.PORT || 5000);
const SERVER_HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_HOST = process.env.VITE_HOST || SERVER_HOST;
let frontendPort = Number(process.env.VITE_PORT || 5173);
const REUSE_EXISTING_BACKEND = process.env.REUSE_EXISTING_BACKEND === 'true';
const BACKEND_WATCH_ENABLED = process.env.BACKEND_WATCH === 'true';
const quietStartup = process.env.QUIET_STARTUP !== 'false';
const FASTAPI_URL = String(
  process.env.FASTAPI_URL || process.env.VITE_FASTAPI_URL || '',
).trim();
const tsxRequirePath = path.resolve(repoRoot, 'backend', 'node_modules', 'tsx', 'dist', 'cjs', 'index.cjs');
const backendServerPath = path.resolve(repoRoot, 'backend', 'api', 'server.ts');
const fastApiDevPath = path.resolve(repoRoot, 'backend', 'scripts', 'start-fastapi-dev.ts');
const viteBinPath = path.resolve(repoRoot, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Build the environment object forwarded to child processes. */
const buildChildEnv = () => ({
  ...process.env,
  QUIET_STARTUP: quietStartup ? 'true' : String(process.env.QUIET_STARTUP || ''),
});

/**
 * Check whether a given port is currently in use (any process).
 * @param {string} host
 * @param {number} port
 * @returns {Promise<boolean>} true if something is listening on host:port.
 */
const isPortInUse = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

/**
 * Find the first available port starting from `startPort`.
 * Ports listed in `excludePorts` are skipped even if they appear free
 * (prevents backend/frontend collision).
 */
const findFreePort = async (
  host: string,
  startPort: number,
  excludePorts = new Set<number>(),
  maxAttempts = 20,
) => {
  for (let candidate = startPort, attempts = 0; attempts < maxAttempts; candidate += 1, attempts += 1) {
    if (excludePorts.has(candidate)) continue;
    const inUse = await isPortInUse(host, candidate);
    if (!inUse) return candidate;
  }
  return null;
};

// ---------------------------------------------------------------------------
// pnpm script runner
// ---------------------------------------------------------------------------

const runNodeScript = (prefixDir: string, args: string[], cwd?: string) => {
  const options = {
    stdio: 'pipe' as const,
    shell: false,
    env: buildChildEnv(),
    cwd,
  };

  const child = spawn(process.execPath, args, options);
  const prefix = `[${prefixDir}] `;

  if (child.stdout) {
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line || i < lines.length - 1) {
          process.stdout.write(line ? `${prefix}${line}\n` : '\n');
        }
      }
    });
  }

  if (child.stderr) {
    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line || i < lines.length - 1) {
          process.stderr.write(line ? `${prefix}${line}\n` : '\n');
        }
      }
    });
  }

  return child;
};

const runBackendServer = () => {
  const backendArgs = BACKEND_WATCH_ENABLED
    ? ['--require', tsxRequirePath, '--watch', backendServerPath]
    : ['--require', tsxRequirePath, backendServerPath];
  return runNodeScript('backend', backendArgs, path.resolve(repoRoot, 'backend'));
};

// ---------------------------------------------------------------------------
// FastAPI helpers
// ---------------------------------------------------------------------------

const shouldStartLocalFastApi = () => {
  if (!FASTAPI_URL) return false;
  try {
    const url = new URL(FASTAPI_URL);
    const host = String(url.hostname || '').toLowerCase();
    return host === '127.0.0.1' || host === 'localhost';
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Health-check
// ---------------------------------------------------------------------------

const isHealthyServerRunning = () =>
  new Promise<boolean>((resolve) => {
    const request = http.get(
      {
        host: SERVER_HOST,
        port: SERVER_PORT,
        path: '/api/health',
        timeout: 1500,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

const isLocalHttpUrl = (value: unknown) =>
  /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(String(value || '').trim());

const applyFrontendPortOverride = (fromPort: number, nextPort: number) => {
  frontendPort = nextPort;
  if (isLocalHttpUrl(process.env.CLIENT_URL)) {
    process.env.CLIENT_URL = `http://${FRONTEND_HOST}:${nextPort}`;
  }
  if (isLocalHttpUrl(process.env.VITE_SITE_URL)) {
    process.env.VITE_SITE_URL = `http://${FRONTEND_HOST}:${nextPort}`;
  }

  console.warn(`Frontend port ${fromPort} is in use. Falling back to http://${FRONTEND_HOST}:${nextPort}`);
};

// ---------------------------------------------------------------------------
// Process lifecycle
// ---------------------------------------------------------------------------

let shuttingDown = false;
let frontendStarted = false;
let serverReadyLogged = false;
let serverProcess: ReturnType<typeof spawn> | null = null;
let frontendProcess: ReturnType<typeof spawn> | null = null;
let fastApiProcess: ReturnType<typeof spawn> | null = null;

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (frontendProcess && !frontendProcess.killed) frontendProcess.kill();
  if (fastApiProcess && !fastApiProcess.killed) fastApiProcess.kill();
  if (serverProcess && !serverProcess.killed) serverProcess.kill();

  process.exit(code);
};

const startFrontend = () => {
  if (frontendStarted || shuttingDown) return;
  frontendStarted = true;
  frontendProcess = runNodeScript('frontend', [viteBinPath], path.resolve(repoRoot, 'frontend'));
  frontendProcess.on('exit', (code) => shutdown(code ?? 0));
};

const startFastApi = () => {
  if (shuttingDown || fastApiProcess || !shouldStartLocalFastApi()) return;
  fastApiProcess = runNodeScript('backend', ['--require', tsxRequirePath, fastApiDevPath], path.resolve(repoRoot, 'backend'));
  fastApiProcess.on('exit', (code) => {
    fastApiProcess = null;
    if (!shuttingDown && Number(code) !== 0) {
      console.warn('FastAPI dev process exited. Chatbot replies may fail until FastAPI is restarted.');
    }
  });
};

const waitForServer = () => {
  if (shuttingDown || serverReadyLogged) return;

  const socket = net.createConnection({ port: SERVER_PORT, host: SERVER_HOST });
  socket.once('connect', () => {
    socket.end();
    serverReadyLogged = true;
    if (!quietStartup) {
      console.log(`API ready at http://${SERVER_HOST}:${SERVER_PORT}`);
    }
  });
  socket.once('error', () => {
    socket.destroy();
    setTimeout(waitForServer, 250);
  });
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const bootstrap = async () => {
  // 1. Check for a healthy backend we can reuse
  const healthyServerRunning = await isHealthyServerRunning();
  if (healthyServerRunning && REUSE_EXISTING_BACKEND) {
    serverReadyLogged = true;
    console.warn(
      'REUSE_EXISTING_BACKEND=true: reusing an already-running backend process ' +
      '(code changes may not be picked up until restart).',
    );
    if (!quietStartup) {
      console.log(`API ready at http://${SERVER_HOST}:${SERVER_PORT}`);
    }
    startFrontend();
    return;
  }

  // 2. Resolve backend port
  if (await isPortInUse(SERVER_HOST, SERVER_PORT)) {
    console.warn(`Port ${SERVER_PORT} is in use. Searching for a free alternative...`);
    const freePort = await findFreePort(SERVER_HOST, SERVER_PORT + 1);
    if (freePort === null) {
      console.error(`No free backend port found (scanned ${SERVER_PORT + 1}–${SERVER_PORT + 20}).`);
      process.exit(1);
    }
    console.log(`Using alternative backend port ${freePort}.`);
    SERVER_PORT = freePort;
  }

  // Sync env so child processes (backend server.js) pick up the resolved port
  process.env.PORT = String(SERVER_PORT);

  // 3. Resolve frontend port — exclude backend port to prevent collision
  const excludePorts = new Set([SERVER_PORT]);

  if (await isPortInUse(FRONTEND_HOST, frontendPort) || frontendPort === SERVER_PORT) {
    const freeFrontPort = await findFreePort(FRONTEND_HOST, frontendPort + 1, excludePorts);
    if (freeFrontPort === null) {
      console.error(`No free frontend port found (scanned ${frontendPort + 1}–${frontendPort + 20}).`);
      process.exit(1);
    }
    applyFrontendPortOverride(frontendPort, freeFrontPort);
  }

  // Sync frontend port env
  process.env.VITE_PORT = String(frontendPort);

  // 4. Final collision safety check
  if (SERVER_PORT === frontendPort) {
    console.error(
      `Fatal: backend (${SERVER_PORT}) and frontend (${frontendPort}) resolved to the same port. Aborting.`,
    );
    process.exit(1);
  }

  // 5. Launch everything
  serverProcess = runBackendServer();
  startFastApi();
  startFrontend();
  serverProcess.on('exit', (code) => shutdown(code ?? 0));
  waitForServer();
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

bootstrap();
