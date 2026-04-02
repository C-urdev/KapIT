import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const scriptName = process.argv[2] || 'dev';
const appDirectory = path.resolve(process.cwd(), 'apps/web');
const nextHost = process.env.NEXTJS_HOST;
const nextPort = process.env.NEXTJS_PORT || '3000';
const hideNetworkLine = process.env.HIDE_NEXT_NETWORK_LINE === 'true';
const quietStartup = process.env.QUIET_STARTUP === 'true';
const isWindows = process.platform === 'win32';
const command = isWindows ? 'cmd.exe' : 'npm';
const args = isWindows
  ? ['/c', 'npm', '--silent', 'run', scriptName]
  : ['--silent', 'run', scriptName];

if (scriptName === 'dev') {
  fs.rmSync(path.join(appDirectory, '.next'), { recursive: true, force: true });
}

if (scriptName === 'dev' || scriptName === 'start') {
  args.push('--', '-p', nextPort);

  if (nextHost) {
    args.push('-H', nextHost);
  }
}

const { PORT: _ignoredPort, HOST: _ignoredHost, ...forwardedEnv } = process.env;
const normalizedNodeEnv =
  scriptName === 'build' ? 'production' : scriptName === 'dev' ? 'development' : process.env.NODE_ENV;

const child = spawn(command, args, {
  cwd: appDirectory,
  env: {
    ...forwardedEnv,
    ...(normalizedNodeEnv ? { NODE_ENV: normalizedNodeEnv } : {}),
    PORT: nextPort,
    HOST: nextHost,
    INIT_CWD: appDirectory,
    npm_config_local_prefix: appDirectory,
  },
  stdio: hideNetworkLine || quietStartup ? ['inherit', 'pipe', 'pipe'] : 'inherit',
  shell: false,
});

if (hideNetworkLine || quietStartup) {
  const shouldSkipLine = (line) => {
    if (hideNetworkLine && line.includes('- Network:')) {
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

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

