import express from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(scriptDirectory, 'public')));

// Endpoint to start the dev server
app.post('/api/start', (req, res) => {
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(pnpmCmd, ['start'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  child.on('error', (err) => {
    console.error('Failed to launch pnpm start:', err);
    res.status(500).json({ error: err.message });
  });
  child.on('exit', (code) => {
    console.log(`pnpm start exited with code ${code}`);
    res.json({ exitCode: code });
  });
});

const PORT = process.env.UI_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Start UI listening at http://localhost:${PORT}`);
});
