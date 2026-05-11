const fs = require('fs');
const path = require('path');

const source = path.join('.next', 'routes-manifest.json');
const target = path.join('.next', 'routes-manifest-deterministic.json');
const deploymentBuild =
  process.env.CI === 'true' || Boolean(process.env.VERCEL) || Boolean(process.env.DEPLOY_ID);

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
    const rootTarget = path.join(rootNextDir, 'routes-manifest-deterministic.json');

    try {
      fs.mkdirSync(rootNextDir, { recursive: true });
      fs.copyFileSync(target, rootTarget);
      console.log(`[vercel-manifest-fix] Synced ${rootTarget}`);
    } catch (error) {
      console.warn(`[vercel-manifest-fix] Could not sync ${rootTarget}: ${error.message}`);
    }
  }
}
