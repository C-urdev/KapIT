import fs from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.resolve(process.cwd(), '.next');
const sourcePath = path.join(nextDir, 'routes-manifest.json');
const targetPath = path.join(nextDir, 'routes-manifest-deterministic.json');

const ensureManifest = async () => {
  try {
    await fs.access(targetPath);
    return;
  } catch {
    // Fall through and create it from routes-manifest.json.
  }

  const sourceBuffer = await fs.readFile(sourcePath);
  await fs.writeFile(targetPath, sourceBuffer);
  console.log('Created .next/routes-manifest-deterministic.json');
};

ensureManifest().catch((error) => {
  console.error('Failed to ensure deterministic routes manifest:', error);
  process.exit(1);
});
