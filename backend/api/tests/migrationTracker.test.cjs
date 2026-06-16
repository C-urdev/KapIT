const test = require('node:test');
const assert = require('node:assert/strict');

test('runMigration uses runtime_migrations table separate from SQL migrations', async () => {
  const pool = require('../config/database');
  const originalConnect = pool.connect;
  const queries = [];

  pool.connect = async () => ({
    query: async (sql, params) => {
      queries.push({ sql: String(sql), params });
      if (/SELECT 1 FROM runtime_migrations WHERE name = \$1/i.test(String(sql))) {
        return { rows: [{ '?column?': 1 }] };
      }
      return { rows: [] };
    },
    release: () => {},
  });

  try {
    delete require.cache[require.resolve('../config/migrationTracker')];
    const { runMigration } = require('../config/migrationTracker');

    await runMigration('001_initial_resume_schema', async () => {});

    assert.ok(
      queries.some((entry) => /CREATE TABLE IF NOT EXISTS runtime_migrations/i.test(entry.sql)),
      'Expected runtime migrations to use a dedicated table'
    );
    assert.ok(
      queries.some((entry) => /SELECT 1 FROM runtime_migrations WHERE name = \$1/i.test(entry.sql)),
      'Expected migration lookup against runtime_migrations.name'
    );
    assert.equal(
      queries.some((entry) => /FROM migrations WHERE name/i.test(entry.sql)),
      false,
      'The tracker must not query the SQL migrations table'
    );
  } finally {
    pool.connect = originalConnect;
    delete require.cache[require.resolve('../config/migrationTracker')];
  }
});
