import { spawn } from 'node:child_process';
import net from 'node:net';

const SERVER_PORT = Number(process.env.PORT || 5000);
const isWindows = process.platform === 'win32';
const command = isWindows ? 'cmd.exe' : 'npm';

const runScript = (scriptName) => {
  if (isWindows) {
    return spawn(command, ['/c', 'npm', 'run', scriptName], {
      stdio: 'inherit',
      shell: false,
    });
  }

  return spawn(command, ['run', scriptName], {
    stdio: 'inherit',
    shell: false,
  });
};

let shuttingDown = false;
let viteStarted = false;

const serverProcess = runScript('server');

let viteProcess = null;

const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }

  process.exit(code);
};

const startVite = () => {
  if (viteStarted || shuttingDown) {
    return;
  }

  viteStarted = true;
  viteProcess = runScript('dev');

  viteProcess.on('exit', (code) => {
    shutdown(code ?? 0);
  });
};

const waitForServer = () => {
  if (shuttingDown || viteStarted) {
    return;
  }

  const socket = net.createConnection({ port: SERVER_PORT, host: '127.0.0.1' });

  socket.once('connect', () => {
    socket.end();
    startVite();
  });

  socket.once('error', () => {
    socket.destroy();
    setTimeout(waitForServer, 250);
  });
};

serverProcess.on('exit', (code) => {
  shutdown(code ?? 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

waitForServer();
