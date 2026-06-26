const { Pool } = require('pg');
const { loadEnvironmentFiles } = require('./env');

loadEnvironmentFiles();

const isSupabaseHost = (host) =>
  typeof host === 'string' && /(?:^|\.)supabase\.(?:co|com)$/i.test(host.trim());
const isSupabasePoolerHost = (host) =>
  typeof host === 'string' && /(?:^|\.)pooler\.supabase\.(?:co|com)$/i.test(host.trim());
const shouldLogStartup = process.env.QUIET_STARTUP !== 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

const requestedMax = toPositiveInt(process.env.DB_POOL_MAX, 20);
const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000);

const SUPABASE_SESSION_PORT = toPositiveInt(process.env.DB_SUPABASE_SESSION_PORT, 5432);
const SUPABASE_SESSION_POOL_MAX = toPositiveInt(process.env.DB_SUPABASE_SESSION_POOL_MAX, 8);

const getHostFromDatabaseUrl = () => {
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

const resolveRejectUnauthorized = (host) => {
  const explicit = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase();
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return !isDevelopment;
  }

  return true;
};

const resolveSslConfig = (host) => {
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

const resolvePoolMax = ({ host, port }) => {
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

const createPoolConfig = () => {
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

pool.on('connect', () => {
  if (shouldLogStartup) {
    console.log('Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED', 'EPIPE'].includes(err?.code)) {
    console.warn(`Transient database connection error (${err.code}). Pool will reconnect automatically.`);
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
