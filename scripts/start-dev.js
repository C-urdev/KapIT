import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local'), override: true });

const SERVER_PORT = Number(process.env.PORT || 5000);
const SERVER_HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_HOST = process.env.NEXTJS_HOST || SERVER_HOST;
let frontendPort = Number(process.env.NEXTJS_PORT || 3000);
const FRONTEND_SCRIPT = process.env.FRONTEND_SCRIPT || 'dev';
const REUSE_EXISTING_BACKEND = process.env.REUSE_EXISTING_BACKEND === 'true';
const BACKEND_WATCH_ENABLED = process.env.BACKEND_WATCH === 'true';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const isWindows = process.platform === 'win32';
const quietStartup = process.env.QUIET_STARTUP !== 'false';
const hideNextNetworkLine = process.env.HIDE_NEXT_NETWORK_LINE !== 'false';
const FASTAPI_URL = String(process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || '').trim();

const buildChildEnv = () => ({
  ...process.env,
  QUIET_STARTUP: quietStartup ? 'true' : String(process.env.QUIET_STARTUP || ''),
  HIDE_NEXT_NETWORK_LINE: hideNextNetworkLine ? 'true' : String(process.env.HIDE_NEXT_NETWORK_LINE || ''),
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
});

const runNpmScript = (prefixDir, scriptName) => {
  const args = ['--silent', '--prefix', path.resolve(repoRoot, prefixDir), 'run', scriptName];
  const options = {
    stdio: 'inherit',
    shell: false,
    env: buildChildEnv(),
  };

  try {
    return spawn(npmCommand, args, options);
  } catch (error) {
    const canRetryWithShell =
      process.platform === 'win32' && (error?.code === 'EINVAL' || error?.code === 'EPERM');

    if (!canRetryWithShell) {
      throw error;
    }

    return spawn('cmd.exe', ['/d', '/s', '/c', npmCommand, ...args], options);
  }
};

const runBackendServer = () => {
  return runNpmScript('backend', BACKEND_WATCH_ENABLED ? 'watch' : 'start');
};

const shouldStartLocalFastApi = () => {
  if (!FASTAPI_URL) {
    return false;
  }

  try {
    const url = new URL(FASTAPI_URL);
    const host = String(url.hostname || '').toLowerCase();
    return host === '127.0.0.1' || host === 'localhost';
  } catch {
    return false;
  }
};

const runPowerShell = (command) =>
  new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exited with code ${code}`));
    });
  });

const stopNodeProcessOnPort = async (port) => {
  if (!isWindows) {
    return false;
  }

  const command = `$conn = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if (-not $conn) { exit 0 }; $pid = $conn.OwningProcess; $proc = Get-CimInstance Win32_Process -Filter \"ProcessId = $pid\"; if ($proc.Name -ne 'node.exe') { Write-Output \"SKIP:$($proc.Name):$pid\"; exit 0 }; Stop-Process -Id $pid -Force; Write-Output \"STOPPED:$pid\";`;

  try {
    const output = await runPowerShell(command);
    if (output.startsWith('STOPPED:')) {
      console.log(`Stopped stale Node process on port ${port}.`);
      return true;
    }
    if (output.startsWith('SKIP:')) {
      console.warn(`Port ${port} is in use by a non-Node process.`);
    }
  } catch (error) {
    console.warn(`Unable to stop process on port ${port}: ${error.message}`);
  }

  return false;
};

const isPortOpen = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port: SERVER_PORT, host: SERVER_HOST });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

const isFrontendPortOpen = () =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port: frontendPort, host: FRONTEND_HOST });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

const isLocalHttpUrl = (value) => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(String(value || '').trim());

const applyFrontendPortOverride = (fromPort, nextPort) => {
  frontendPort = nextPort;
  process.env.NEXTJS_PORT = String(nextPort);

  if (isLocalHttpUrl(process.env.CLIENT_URL)) {
    process.env.CLIENT_URL = `http://${FRONTEND_HOST}:${nextPort}`;
  }

  if (isLocalHttpUrl(process.env.NEXT_PUBLIC_SITE_URL)) {
    process.env.NEXT_PUBLIC_SITE_URL = `http://${FRONTEND_HOST}:${nextPort}`;
  }

  console.warn(`Frontend port ${fromPort} is in use. Falling back to http://${FRONTEND_HOST}:${nextPort}`);
};

const findAvailableFrontendPort = async (startPort, maxAttempts = 20) => {
  for (let candidate = startPort, attempts = 0; attempts < maxAttempts; candidate += 1, attempts += 1) {
    frontendPort = candidate;
    // eslint-disable-next-line no-await-in-loop
    const open = await isFrontendPortOpen();
    if (!open) {
      return candidate;
    }
  }

  return null;
};

const isHealthyServerRunning = () =>
  new Promise((resolve) => {
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
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => {
      resolve(false);
    });
  });

let shuttingDown = false;
let frontendStarted = false;
let serverReadyLogged = false;
let serverProcess = null;
let frontendProcess = null;
let fastApiProcess = null;

const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill();
  }

  if (fastApiProcess && !fastApiProcess.killed) {
    fastApiProcess.kill();
  }

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }

  process.exit(code);
};

const startFrontend = () => {
  if (frontendStarted || shuttingDown) {
    return;
  }

  frontendStarted = true;
  frontendProcess = runNpmScript('frontend', FRONTEND_SCRIPT);

  frontendProcess.on('exit', (code) => {
    shutdown(code ?? 0);
  });
};

const startFastApi = () => {
  if (shuttingDown || fastApiProcess || !shouldStartLocalFastApi()) {
    return;
  }

  fastApiProcess = runNpmScript('backend', 'fastapi:dev');
  fastApiProcess.on('exit', (code) => {
    fastApiProcess = null;
    if (!shuttingDown && Number(code) !== 0) {
      console.warn('FastAPI dev process exited. Chatbot replies may fail until FastAPI is restarted.');
    }
  });
};

const waitForServer = () => {
  if (shuttingDown || serverReadyLogged) {
    return;
  }

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

const bootstrap = async () => {
  const healthyServerRunning = await isHealthyServerRunning();

  if (healthyServerRunning && REUSE_EXISTING_BACKEND) {
    serverReadyLogged = true;
    console.warn('REUSE_EXISTING_BACKEND=true: reusing an already-running backend process (code changes may not be picked up until restart).');
    if (!quietStartup) {
      console.log(`API ready at http://${SERVER_HOST}:${SERVER_PORT}`);
    }
    startFrontend();
    return;
  }

  const portOpen = await isPortOpen();
  if (portOpen) {
    const stopped = await stopNodeProcessOnPort(SERVER_PORT);
    if (!stopped && (await isPortOpen())) {
      console.error(`Port ${SERVER_PORT} is already in use. Stop the old backend first, then run npm start again.`);
      process.exit(1);
    }
  }

  if (frontendPort !== SERVER_PORT) {
    const frontendPortOpen = await isFrontendPortOpen();
    if (frontendPortOpen) {
      const configuredFrontendPort = frontendPort;
      const stopped = await stopNodeProcessOnPort(configuredFrontendPort);
      if (!stopped && (await isFrontendPortOpen())) {
        const fallbackPort = await findAvailableFrontendPort(configuredFrontendPort + 1);
        if (fallbackPort === null) {
          console.error(`Port ${configuredFrontendPort} is already in use and no fallback frontend port was found.`);
          process.exit(1);
        }

        applyFrontendPortOverride(configuredFrontendPort, fallbackPort);
      }
    }
  }

  serverProcess = runBackendServer();
  startFastApi();
  startFrontend();
  serverProcess.on('exit', async (code) => {
    shutdown(code ?? 0);
  });

  waitForServer();
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

bootstrap();
