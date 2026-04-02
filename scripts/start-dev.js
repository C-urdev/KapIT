import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const SERVER_PORT = Number(process.env.PORT || 5000);
const SERVER_HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_PORT = Number(process.env.NEXTJS_PORT || 3000);
const FRONTEND_SCRIPT = process.env.FRONTEND_SCRIPT || 'dev';
const REUSE_EXISTING_BACKEND = process.env.REUSE_EXISTING_BACKEND === 'true';
const nodeCommand = process.execPath;
const serverEntry = path.resolve(process.cwd(), 'server/server.js');
const webEntry = path.resolve(process.cwd(), 'scripts/run-web-next.js');
const isWindows = process.platform === 'win32';

const runNodeScript = (entry, args = []) => {
  return spawn(nodeCommand, [entry, ...args], {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
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
      console.error(`Port ${port} is in use by a non-Node process. Stop it manually, then run npm start again.`);
      process.exit(1);
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
    const socket = net.createConnection({ port: FRONTEND_PORT, host: SERVER_HOST });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });

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
let serverProcess = null;
let frontendProcess = null;

const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill();
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
  frontendProcess = runNodeScript(webEntry, [FRONTEND_SCRIPT]);

  frontendProcess.on('exit', (code) => {
    shutdown(code ?? 0);
  });
};

const waitForServer = () => {
  if (shuttingDown || frontendStarted) {
    return;
  }

  const socket = net.createConnection({ port: SERVER_PORT, host: SERVER_HOST });

  socket.once('connect', () => {
    socket.end();
    startFrontend();
  });

  socket.once('error', () => {
    socket.destroy();
    setTimeout(waitForServer, 250);
  });
};

const bootstrap = async () => {
  const healthyServerRunning = await isHealthyServerRunning();

  if (healthyServerRunning && REUSE_EXISTING_BACKEND) {
    console.log(`Reusing existing backend on http://${SERVER_HOST}:${SERVER_PORT}`);
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

  if (FRONTEND_PORT !== SERVER_PORT) {
    const frontendPortOpen = await isFrontendPortOpen();
    if (frontendPortOpen) {
      const stopped = await stopNodeProcessOnPort(FRONTEND_PORT);
      if (!stopped && (await isFrontendPortOpen())) {
        console.error(`Port ${FRONTEND_PORT} is already in use. Stop the old frontend first, then run npm start again.`);
        process.exit(1);
      }
    }
  }

  serverProcess = runNodeScript(serverEntry);
  serverProcess.on('exit', async (code) => {
    if (!frontendStarted && (await isHealthyServerRunning())) {
      startFrontend();
      return;
    }

    shutdown(code ?? 0);
  });

  waitForServer();
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

bootstrap();
