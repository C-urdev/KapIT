const { Pool } = require('pg');
const { loadEnvironmentFiles } = require('./env');

loadEnvironmentFiles();

const isSupabaseHost = (host) =>
  typeof host === 'string' && /(?:^|\.)supabase\.(?:co|com)$/i.test(host.trim());
const shouldLogStartup = process.env.QUIET_STARTUP !== 'true';
const isDevelopment = process.env.NODE_ENV === 'development';
const max = Number(process.env.DB_POOL_MAX || 20);
const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000);

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
    return false;
  }

  if (isSupabaseHost(host)) {
    // Supabase pooler certificates commonly fail strict verification in app hosts
    // unless a matching CA bundle is provided.
    return false;
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

const createPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    const host = getHostFromDatabaseUrl();
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: resolveSslConfig(host),
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  const host = process.env.DB_HOST;

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
  if (err?.code === 'ENOTFOUND') {
    console.error('Database host could not be resolved. Check DB_HOST or DATABASE_URL in your .env.');
  } else {
    console.error('Unexpected database error:', err);
  }
  process.exit(-1);
});

module.exports = pool;
