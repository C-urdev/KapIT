import express from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(import.meta.url, '..', 'public')));

// Endpoint to start the dev server
app.post('/api/start', (req, res) => {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['start'], {
    cwd: path.resolve(import.meta.url, '..', '..'), // project root (z:/kapIT)
    stdio: 'inherit',
    shell: false,
  });
  child.on('error', (err) => {
    console.error('Failed to launch npm start:', err);
    res.status(500).json({ error: err.message });
  });
  child.on('exit', (code) => {
    console.log(`npm start exited with code ${code}`);
    res.json({ exitCode: code });
  });
});

const PORT = process.env.UI_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Start UI listening at http://localhost:${PORT}`);
});
