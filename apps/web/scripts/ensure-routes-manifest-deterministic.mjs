import fs from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.resolve(process.cwd(), '.next');
const sourcePath = path.join(nextDir, 'routes-manifest.json');
const targetPath = path.join(nextDir, 'routes-manifest-deterministic.json');
const repoRootNextDir = path.resolve(process.cwd(), '..', '..', '.next');
const repoRootTargetPath = path.join(repoRootNextDir, 'routes-manifest-deterministic.json');
const repoRootManifestSyncList = [
  'BUILD_ID',
  'app-path-routes-manifest.json',
  'build-manifest.json',
  'fallback-build-manifest.json',
  'images-manifest.json',
  'prerender-manifest.json',
  'required-server-files.js',
  'required-server-files.json',
];

const syncFileToRepoRoot = async (relativePath) => {
  const from = path.join(nextDir, relativePath);
  const to = path.join(repoRootNextDir, relativePath);

  try {
    await fs.access(from);
  } catch {
    return;
  }

  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
};

const syncTopLevelServerFilesToRepoRoot = async () => {
  const sourceServerDir = path.join(nextDir, 'server');
  const targetServerDir = path.join(repoRootNextDir, 'server');

  let entries = [];
  try {
    entries = await fs.readdir(sourceServerDir, { withFileTypes: true });
  } catch {
    return;
  }

  await fs.mkdir(targetServerDir, { recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const from = path.join(sourceServerDir, entry.name);
    const to = path.join(targetServerDir, entry.name);
    await fs.copyFile(from, to);
  }
};

const ensureManifest = async () => {
  try {
    await fs.access(targetPath);
  } catch {
    // Fall through and create it from routes-manifest.json.
    const sourceBuffer = await fs.readFile(sourcePath);
    await fs.writeFile(targetPath, sourceBuffer);
    console.log('Created .next/routes-manifest-deterministic.json');
  }

  if (process.env.NETLIFY === 'true' || process.env.CI === 'true') {
    await fs.mkdir(repoRootNextDir, { recursive: true });
    await fs.copyFile(targetPath, repoRootTargetPath);
    for (const relativePath of repoRootManifestSyncList) {
      await syncFileToRepoRoot(relativePath);
    }
    await syncTopLevelServerFilesToRepoRoot();
    console.log('Synced routes-manifest-deterministic.json to repo root .next for deployment packaging');
  }
};

ensureManifest().catch((error) => {
  console.error('Failed to ensure deterministic routes manifest:', error);
  process.exit(1);
});
