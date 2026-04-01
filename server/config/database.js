const { Pool } = require('pg');
require('dotenv').config();

const isSupabaseHost = (host) => typeof host === 'string' && host.includes('supabase.co');
const shouldLogStartup = process.env.QUIET_STARTUP !== 'true';

const createPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    };
  }

  const host = process.env.DB_HOST;
  const sslEnabled = process.env.DB_SSL === 'true' || isSupabaseHost(host);

  return {
    host,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
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