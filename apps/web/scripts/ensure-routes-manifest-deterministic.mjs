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
  path.join('server', 'app-paths-manifest.json'),
  path.join('server', 'functions-config-manifest.json'),
  path.join('server', 'interception-route-rewrite-manifest.js'),
  path.join('server', 'middleware-build-manifest.js'),
  path.join('server', 'middleware-manifest.json'),
  path.join('server', 'next-font-manifest.js'),
  path.join('server', 'next-font-manifest.json'),
  path.join('server', 'pages-manifest.json'),
  path.join('server', 'server-reference-manifest.js'),
  path.join('server', 'server-reference-manifest.json'),
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

const ensureManifest = async () => {
  try {
    await fs.access(targetPath);
  } catch {
    // Fall through and create it from routes-manifest.json.
    const sourceBuffer = await fs.readFile(sourcePath);
    await fs.writeFile(targetPath, sourceBuffer);
    console.log('Created .next/routes-manifest-deterministic.json');
  }

  if (process.env.VERCEL === '1' || process.env.CI === 'true') {
    await fs.mkdir(repoRootNextDir, { recursive: true });
    await fs.copyFile(targetPath, repoRootTargetPath);
    for (const relativePath of repoRootManifestSyncList) {
      await syncFileToRepoRoot(relativePath);
    }
    console.log('Synced routes-manifest-deterministic.json to repo root .next for deployment packaging');
  }
};

ensureManifest().catch((error) => {
  console.error('Failed to ensure deterministic routes manifest:', error);
  process.exit(1);
});
