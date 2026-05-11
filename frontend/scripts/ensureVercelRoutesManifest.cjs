const fs = require('fs');
const path = require('path');

const source = path.join('.next', 'routes-manifest.json');
const target = path.join('.next', 'routes-manifest-deterministic.json');

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