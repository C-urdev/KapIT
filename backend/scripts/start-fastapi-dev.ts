#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const fastApiRoot = path.resolve(backendRoot, 'ai-fastapi');
const fastApiPort = String(process.env.FASTAPI_PORT || '8000').trim() || '8000';
const fastApiLogLevel = String(process.env.FASTAPI_LOG_LEVEL || 'warning').trim() || 'warning';
const fastApiAccessLogEnabled = String(process.env.FASTAPI_ACCESS_LOG || 'false').trim().toLowerCase() === 'true';

const candidatePythonBinaries = [
  process.env.FASTAPI_PYTHON,
  path.resolve(fastApiRoot, '.venv313', 'Scripts', 'python.exe'),
  path.resolve(fastApiRoot, '.venv', 'Scripts', 'python.exe'),
  path.resolve(fastApiRoot, '.venv313', 'bin', 'python'),
  path.resolve(fastApiRoot, '.venv', 'bin', 'python'),
  'python',
  'py',
].filter(Boolean);

const resolvePythonExecutable = () => {
  for (const candidate of candidatePythonBinaries) {
    if (candidate === 'python' || candidate === 'py') {
      return candidate;
    }
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'python';
};

const pythonExecutable = resolvePythonExecutable();
const uvicornArgs = ['-m', 'uvicorn', 'main:app', '--reload', '--port', fastApiPort, '--log-level', fastApiLogLevel];
if (!fastApiAccessLogEnabled) {
  uvicornArgs.push('--no-access-log');
}
const args = pythonExecutable === 'py'
  ? ['-3.13', ...uvicornArgs]
  : uvicornArgs;

const child = spawn(pythonExecutable, args, {
  cwd: fastApiRoot,
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

child.on('error', (error: Error) => {
  console.error(`Unable to start FastAPI with "${pythonExecutable}": ${error.message}`);
  process.exit(1);
});

child.on('exit', (code: number | null) => {
  process.exit(code == null ? 1 : code);
});
