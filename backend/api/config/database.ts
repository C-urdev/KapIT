const { Pool } = require('pg');
const { loadEnvironmentFiles } = require('./env');
type PoolConfig = import('pg').PoolConfig;
type PoolError = NodeJS.ErrnoException;

loadEnvironmentFiles();

const isSupabaseHost = (host: unknown): boolean =>
  typeof host === 'string' && /(?:^|\.)supabase\.(?:co|com)$/i.test(host.trim());
const isSupabasePoolerHost = (host: unknown): boolean =>
  typeof host === 'string' && /(?:^|\.)pooler\.supabase\.(?:co|com)$/i.test(host.trim());
const shouldLogStartup: boolean = process.env.QUIET_STARTUP !== 'true';
const isDevelopment: boolean = process.env.NODE_ENV === 'development';

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

const requestedMax: number = toPositiveInt(process.env.DB_POOL_MAX, 20);
const idleTimeoutMillis: number = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
const connectionTimeoutMillis: number = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000);
const poolConnectivityWarnCooldownMs: number = toPositiveInt(
  process.env.DB_POOL_CONNECTIVITY_WARN_COOLDOWN_MS,
  30000
);
let lastPoolConnectivityWarnAt = 0;

const SUPABASE_SESSION_PORT: number = toPositiveInt(process.env.DB_SUPABASE_SESSION_PORT, 5432);
const SUPABASE_SESSION_POOL_MAX: number = toPositiveInt(process.env.DB_SUPABASE_SESSION_POOL_MAX, 8);

const getHostFromDatabaseUrl = (): string => {
  const raw = String(process.env.DATABASE_URL || '').trim();
  if (!raw) {
    return '';
  }

  try {
    return new URL(raw).hostname || '';
  } catch {
    return '';
  }
};

const resolveRejectUnauthorized = (host: string): boolean => {
  const explicit = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase();
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return !isDevelopment;
  }

  return true;
};

const resolveSslConfig = (host: string): PoolConfig['ssl'] => {
  const explicitDisable = process.env.DB_SSL === 'false';
  if (explicitDisable && isDevelopment) {
    return false;
  }

  const explicitEnable = process.env.DB_SSL === 'true';
  if (explicitEnable || isSupabaseHost(host) || process.env.DATABASE_URL) {
    return { rejectUnauthorized: resolveRejectUnauthorized(host) };
  }

  // Default to secure SSL outside development, even without explicit flags.
  if (!isDevelopment) {
    return { rejectUnauthorized: true };
  }

  return false;
};

const resolvePoolMax = ({ host, port }: { host: string; port: number }): number => {
  if (isSupabasePoolerHost(host) && Number(port) === SUPABASE_SESSION_PORT) {
    const safeMax = Math.min(requestedMax, SUPABASE_SESSION_POOL_MAX);
    if (safeMax < requestedMax && shouldLogStartup) {
      console.warn(
        `DB pool max capped from ${requestedMax} to ${safeMax} for Supabase session mode (${host}:${port}).`
      );
    }
    return safeMax;
  }
  return requestedMax;
};

const createPoolConfig = (): PoolConfig => {
  if (process.env.DATABASE_URL) {
    const host = getHostFromDatabaseUrl();
    let port = NaN;
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      port = Number(parsed.port || 5432);
    } catch {
      port = NaN;
    }
    const max = resolvePoolMax({ host, port });
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: resolveSslConfig(host),
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || 5432);
  const max = resolvePoolMax({ host, port });

  return {
    host,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: resolveSslConfig(host),
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
};

const pool = new Pool(createPoolConfig());

const getNestedErrors = (error: unknown): unknown[] => {
  if (!error || typeof error !== 'object') {
    return [];
  }

  if (Array.isArray((error as { aggregateErrors?: unknown[] }).aggregateErrors)) {
    return (error as { aggregateErrors: unknown[] }).aggregateErrors;
  }

  if (error instanceof AggregateError && Array.isArray(error.errors)) {
    return error.errors;
  }

  return [];
};

const TRANSIENT_DATABASE_ERROR_CODES = new Set([
  'EACCES',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
]);

const getDatabaseErrorCodes = (error: unknown, seen = new Set<unknown>()): string[] => {
  if (!error || seen.has(error)) {
    return [];
  }

  seen.add(error);
  const directCode = String((error as { code?: unknown })?.code || '').trim();
  const nestedCodes = getNestedErrors(error).flatMap((nestedError) => getDatabaseErrorCodes(nestedError, seen));
  return directCode ? [directCode, ...nestedCodes] : nestedCodes;
};

const isDatabaseConnectivityError = (error: unknown): boolean => {
  const codes = getDatabaseErrorCodes(error);
  return codes.some((code) => TRANSIENT_DATABASE_ERROR_CODES.has(code));
};

const summarizeDatabaseConnectivityError = (error: unknown): string => {
  const codes = [...new Set(getDatabaseErrorCodes(error))];
  if (!codes.length) {
    return error instanceof Error ? error.message : String(error || 'database unavailable');
  }
  return `database unavailable (${codes.join(', ')})`;
};

const isAggregateLikeDatabaseError = (error: unknown): boolean => {
  const name = String((error as { name?: unknown })?.name || '').trim();
  const message = String((error as { message?: unknown })?.message || '').trim();
  return name === 'AggregateError' || /^AggregateError\b/i.test(message);
};

pool.on('connect', () => {
  if (shouldLogStartup) {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err: PoolError) => {
  if (isDatabaseConnectivityError(err) || isAggregateLikeDatabaseError(err)) {
    const current = Date.now();
    if (current - lastPoolConnectivityWarnAt >= poolConnectivityWarnCooldownMs) {
      lastPoolConnectivityWarnAt = current;
      console.warn(
        `Transient database connection error (${summarizeDatabaseConnectivityError(err)}). Pool will reconnect automatically.`
      );
    }
    // Do NOT exit the process. pg pool will discard the broken connection and create a new one.
    return;
  }
  
  if (err?.code === 'ENOTFOUND') {
    console.error('Database host could not be resolved. Check DB_HOST or DATABASE_URL in your .env.');
    process.exit(-1);
  } else {
    console.error('Unexpected database error:', err);
    // You might choose to exit here, or keep it running depending on your needs.
    // Given the nature of a persistent API, it's often better to let it retry.
  }
});

module.exports = pool;
module.exports.isDatabaseConnectivityError = isDatabaseConnectivityError;
module.exports.summarizeDatabaseConnectivityError = summarizeDatabaseConnectivityError;
