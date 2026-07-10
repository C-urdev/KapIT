import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const migrationsDir = path.join(repoRoot, 'database', 'migrations');

dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local'), override: true });

type PgClient = import('pg').Client;
const require = createRequire(import.meta.url);

let Client: new (config: { connectionString: string; ssl: { rejectUnauthorized: boolean } }) => PgClient;
try {
  ({ Client } = require('pg'));
} catch {
  try {
    ({ Client } = require(path.resolve(repoRoot, 'backend', 'node_modules', 'pg')));
  } catch (error: unknown) {
    throw new Error(
      `Unable to load "pg". Install dependencies before running migrations. ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const allowProd = args.has('--allow-prod');
const envArg = process.argv.find((arg) => arg.startsWith('--env='));
const envKey = envArg ? envArg.slice('--env='.length) : 'STAGING_DATABASE_URL';

const connectionString = String(process.env[envKey] || '').trim();

const resolveMigrationSsl = (databaseUrl: string): false | { rejectUnauthorized: boolean } => {
  try {
    const parsed = new URL(databaseUrl);
    const host = String(parsed.hostname || '').trim().toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      return false;
    }
  } catch {
    // Let client connection report malformed URLs later.
  }
  return { rejectUnauthorized: false };
};

const listMigrations = (): string[] => {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const sha256 = (content: string): string =>
  crypto.createHash('sha256').update(content, 'utf8').digest('hex');

const ensureMigrationsTable = async (client: PgClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.migrations (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
};

const getAppliedMap = async (client: PgClient): Promise<Map<string, string>> => {
  const res = await client.query(`
    SELECT filename, checksum
    FROM public.migrations
  `);
  const map = new Map<string, string>();
  for (const row of res.rows as Array<{ filename: string; checksum: string }>) {
    map.set(row.filename, row.checksum);
  }
  return map;
};

const run = async (): Promise<void> => {
  const files = listMigrations();
  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  if (dryRun) {
    console.log('Dry run. Files that would be considered:');
    for (const file of files) {
      console.log(`- ${file}`);
    }
    return;
  }

  if (!connectionString) {
    console.error(`Missing ${envKey}.`);
    console.error('Set it, then run again.');
    process.exit(1);
  }

  const looksLikeProd =
    /kapit[-_]?prod/i.test(connectionString) ||
    /prod/i.test(connectionString) ||
    /production/i.test(connectionString);

  if (looksLikeProd && !allowProd) {
    console.error('Refusing to run: connection string looks like production.');
    console.error('If this is intentional, rerun with --allow-prod.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: resolveMigrationSsl(connectionString),
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMap(client);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = sha256(sql);
      const existingChecksum = applied.get(file);

      if (existingChecksum) {
        if (existingChecksum !== checksum) {
          throw new Error(`Checksum mismatch for already-applied migration ${file}.`);
        }
        console.log(`Skipping (already applied): ${file}`);
        skippedCount += 1;
        continue;
      }

      console.log(`Applying: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `
          INSERT INTO public.migrations (filename, checksum)
          VALUES ($1, $2)
          `,
          [file, checksum]
        );
        await client.query('COMMIT');
        appliedCount += 1;
      } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw new Error(`Failed migration ${file}: ${error instanceof Error ? error.message : error}`);
      }
    }

    const tableCountRes = await client.query(`
      SELECT count(*)::int AS table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log('');
    console.log('Done.');
    console.log(`Applied: ${appliedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Public tables: ${tableCountRes.rows[0].table_count}`);
  } finally {
    await client.end();
  }
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
