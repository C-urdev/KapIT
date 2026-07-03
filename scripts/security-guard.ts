import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const blockedPathPatterns = [
  /^\.env$/i,
  /^\.env\.(?!example$).+/i,
  /^frontend\/\.env(?:\..+)?$/i,
  /^backend\/\.env(?:\..+)?$/i,
  /^database\/reports\/.+\.sql$/i,
  /^database\/(?:backups|backup|snapshots|snapshot|exports|export)\/.+$/i,
  /^.+\.(?:dump|pgdump|sql\.gz|sql\.zip|sql\.bz2)$/i,
  /^.+(?:prod|staging).+(?:snapshot|backup|dump|export).+\.(?:sql|dump|json)$/i,
  /^.+(?:token|session|oauth).+(?:dump|export|backup).+\.(?:json|txt|csv)$/i,
];

const secretContentPatterns = [
  /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP)? ?PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9._-]{8,}\.[A-Za-z0-9._-]{8,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bAIza[0-9A-Za-z\-_]{35}\b/,
];

const contentAllowlistPatterns = [
  /^\.env\.example$/i,
  /^backend\/api\/tests\/.+\.test\.cjs$/i,
  /^backend\/api\/tests\/testEnv\.cjs$/i,
  /^SECURITY_ROTATION\.md$/i,
];

const normalizePath = (value: string): string => String(value || '').replace(/\\/g, '/');

const isAllowedForContentScan = (filePath: string): boolean =>
  contentAllowlistPatterns.some((pattern) => pattern.test(filePath));

const listStagedFiles = (): string[] => {
  const raw = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return raw
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
};

const listRepoFiles = (): string[] => {
  const trackedRaw = execFileSync('git', ['ls-files'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const untrackedRaw = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const files = new Set<string>();
  for (const raw of [trackedRaw, untrackedRaw]) {
    raw
      .split(/\r?\n/)
      .map((line) => normalizePath(line.trim()))
      .filter(Boolean)
      .forEach((file) => files.add(file));
  }

  return Array.from(files);
};

const pathViolations = (files: string[]): string[] =>
  files.filter((filePath) => blockedPathPatterns.some((pattern) => pattern.test(filePath)));

const looksBinary = (buffer: Buffer): boolean => {
  if (!buffer.length) {
    return false;
  }

  const limit = Math.min(buffer.length, 2048);
  for (let index = 0; index < limit; index += 1) {
    if (buffer[index] === 0) {
      return true;
    }
  }

  return false;
};

const contentViolations = (files: string[]): string[] => {
  const flagged: string[] = [];

  for (const relativePath of files) {
    if (isAllowedForContentScan(relativePath)) {
      continue;
    }

    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    let contentBuffer: Buffer;
    try {
      contentBuffer = fs.readFileSync(absolutePath);
    } catch {
      continue;
    }

    if (looksBinary(contentBuffer)) {
      continue;
    }

    const content = contentBuffer.toString('utf8');
    const matched = secretContentPatterns.find((pattern) => pattern.test(content));
    if (matched) {
      flagged.push(relativePath);
    }
  }

  return flagged;
};

const printList = (title: string, files: string[]): void => {
  if (!files.length) {
    return;
  }

  console.error(title);
  for (const file of files) {
    console.error(`- ${file}`);
  }
};

const main = (): void => {
  const scanAll = process.argv.includes('--all');
  let stagedFiles: string[] = [];
  try {
    stagedFiles = scanAll ? listRepoFiles() : listStagedFiles();
  } catch (error: unknown) {
    console.error('Security guard could not read repository files.');
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  }

  if (!stagedFiles.length) {
    process.exit(0);
  }

  const blockedFiles = pathViolations(stagedFiles);
  const leakedFiles = contentViolations(stagedFiles);

  if (!blockedFiles.length && !leakedFiles.length) {
    process.exit(0);
  }

  console.error('Commit blocked by repository security guard.');
  printList('Blocked sensitive file paths:', blockedFiles);
  printList('Potential secrets detected in file contents:', leakedFiles);
  console.error('If this is false positive test data, move it under approved test files or sanitize it first.');
  process.exit(1);
};

main();
