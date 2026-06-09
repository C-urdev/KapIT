const pool = require('./database');
const { logger } = require('./logger');

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.query(`
    ALTER TABLE migrations
      ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
  `);
};

/**
 * Runs a schema initialization script safely, recording its execution in the migrations table.
 * If the migration was already run, it skips execution.
 * 
 * @param {string} migrationName - A unique string identifier for this migration (e.g., '001_initial_resume_schema')
 * @param {Function} up - An async function that takes a Postgres client and executes the schema changes
 */
const runMigration = async (migrationName, up) => {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    const { rows } = await client.query('SELECT 1 FROM migrations WHERE name = $1', [migrationName]);
    if (rows.length > 0) {
      logger.info({ migrationName }, 'Migration already executed, skipping.');
      return;
    }

    await client.query('BEGIN');
    
    // Execute the actual schema changes
    await up(client);

    // Record successful execution
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);
    
    await client.query('COMMIT');
    logger.info({ migrationName }, 'Migration executed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ migrationName, error: error?.message || String(error) }, 'Migration failed.');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  runMigration
};
