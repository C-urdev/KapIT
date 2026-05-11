const fs = require('fs');
const path = require('path');

const nextDir = path.join('.next');
const source = path.join(nextDir, 'routes-manifest.json');
const target = path.join(nextDir, 'routes-manifest-deterministic.json');
const deploymentBuild =
  process.env.CI === 'true' || Boolean(process.env.VERCEL) || Boolean(process.env.DEPLOY_ID);
const repoRootManifestSyncList = [
  'BUILD_ID',
  'export-marker.json',
  'images-manifest.json',
  'prerender-manifest.json',
  'routes-manifest.json',
  'routes-manifest-deterministic.json',
  'app-path-routes-manifest.json',
  'build-manifest.json',
  'fallback-build-manifest.json',
  'required-server-files.js',
  'required-server-files.json',
  'next-server.js.nft.json',
  'next-minimal-server.js.nft.json',
  'package.json',
];

const copyIfExists = (from, to) => {
  if (!fs.existsSync(from)) {
    return false;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
};

const syncTopLevelServerFiles = (rootNextDir) => {
  const sourceServerDir = path.join(nextDir, 'server');
  if (!fs.existsSync(sourceServerDir)) {
    return;
  }

  const entries = fs.readdirSync(sourceServerDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const from = path.join(sourceServerDir, entry.name);
    const to = path.join(rootNextDir, 'server', entry.name);
    copyIfExists(from, to);
  }
};

const mirrorDirectory = (fromDir, toDir, skipNames = new Set()) => {
  if (!fs.existsSync(fromDir)) {
    return;
  }

  fs.mkdirSync(toDir, { recursive: true });
  const entries = fs.readdirSync(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    if (skipNames.has(entry.name)) {
      continue;
    }

    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      mirrorDirectory(from, to, skipNames);
      continue;
    }

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
};

const syncNextRuntimePackage = (root) => {
  const sourceNextPackageDir = path.resolve('node_modules', 'next');
  const rootNextPackageDir = path.join(root, 'node_modules', 'next');
  const absoluteRootNextPackageDir = path.resolve(rootNextPackageDir);

  if (!fs.existsSync(sourceNextPackageDir) || absoluteRootNextPackageDir === sourceNextPackageDir) {
    return;
  }

  // Vercel post-build can resolve Next runtime files from repo root.
  // Mirror Next package runtime assets so root lookups do not fail.
  const sourceDistDir = path.join(sourceNextPackageDir, 'dist');
  const targetDistDir = path.join(rootNextPackageDir, 'dist');
  mirrorDirectory(sourceDistDir, targetDistDir);
  copyIfExists(path.join(sourceNextPackageDir, 'package.json'), path.join(rootNextPackageDir, 'package.json'));
  console.log(`[vercel-manifest-fix] Mirrored next runtime package to ${rootNextPackageDir}`);
};

const syncTracedNodeModulesFiles = (rootNextDir) => {
  const traceFiles = ['next-server.js.nft.json', 'next-minimal-server.js.nft.json'];
  const copiedPaths = new Set();

  for (const traceFile of traceFiles) {
    const tracePath = path.join(nextDir, traceFile);
    if (!fs.existsSync(tracePath)) {
      continue;
    }

    let tracePayload;
    try {
      tracePayload = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
    } catch (error) {
      console.warn(`[vercel-manifest-fix] Could not parse ${tracePath}: ${error.message}`);
      continue;
    }

    const files = Array.isArray(tracePayload?.files) ? tracePayload.files : [];
    for (const relativeFile of files) {
      if (typeof relativeFile !== 'string' || !relativeFile.startsWith('../node_modules/')) {
        continue;
      }

      const sourcePath = path.resolve(nextDir, relativeFile);
      const targetPath = path.resolve(rootNextDir, relativeFile);
      if (sourcePath === targetPath || copiedPaths.has(targetPath)) {
        continue;
      }

      if (copyIfExists(sourcePath, targetPath)) {
        copiedPaths.add(targetPath);
      }
    }
  }

  if (copiedPaths.size > 0) {
    console.log(`[vercel-manifest-fix] Synced ${copiedPaths.size} traced node_modules runtime files to repo root`);
  }
};

if (!fs.existsSync(source)) {
  console.warn(`[vercel-manifest-fix] Source missing: ${source}`);
  process.exit(0);
}

if (!fs.existsSync(target)) {
  fs.copyFileSync(source, target);
  console.log(`[vercel-manifest-fix] Created ${target}`);
} else {
  console.log(`[vercel-manifest-fix] Already exists: ${target}`);
}

if (deploymentBuild) {
  const cwd = process.cwd();
  const repoRootCandidates = [cwd, path.resolve(cwd, '..')];
  const dedupedCandidates = [...new Set(repoRootCandidates)];

  for (const root of dedupedCandidates) {
    const rootNextDir = path.join(root, '.next');
    const sourceNextDir = path.resolve(nextDir);
    const absoluteRootNextDir = path.resolve(rootNextDir);

    try {
      fs.mkdirSync(rootNextDir, { recursive: true });
      for (const relativePath of repoRootManifestSyncList) {
        const from = path.join(nextDir, relativePath);
        const to = path.join(rootNextDir, relativePath);
        if (copyIfExists(from, to)) {
          console.log(`[vercel-manifest-fix] Synced ${to}`);
        }
      }

      syncTopLevelServerFiles(rootNextDir);
      if (absoluteRootNextDir !== sourceNextDir) {
        mirrorDirectory(nextDir, rootNextDir, new Set(['cache', 'dev', 'diagnostics', 'trace', 'trace-build', 'turbopack']));
        console.log(`[vercel-manifest-fix] Mirrored .next tree to ${rootNextDir}`);
        syncTracedNodeModulesFiles(rootNextDir);
      }

      syncNextRuntimePackage(root);
    } catch (error) {
      console.warn(`[vercel-manifest-fix] Could not sync .next artifacts to ${rootNextDir}: ${error.message}`);
    }
  }
}
