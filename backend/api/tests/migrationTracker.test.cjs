const test = require('node:test');
const assert = require('node:assert/strict');

test('runMigration tolerates migrations tables missing executed_at', async () => {
  const pool = require('../config/database');
  const originalConnect = pool.connect;
  const queries = [];

  pool.connect = async () => ({
    query: async (sql, params) => {
      queries.push({ sql: String(sql), params });
      if (/SELECT 1 FROM migrations WHERE name = \$1/i.test(String(sql))) {
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
      queries.some((entry) => /SELECT 1 FROM migrations WHERE name = \$1/i.test(entry.sql)),
      'Expected migration lookup to avoid the executed_at column'
    );
    assert.ok(
      queries.some((entry) => /ADD COLUMN IF NOT EXISTS executed_at/i.test(entry.sql)),
      'Expected the migrations table to self-heal a missing executed_at column'
    );
    assert.equal(
      queries.some((entry) => /SELECT executed_at FROM migrations/i.test(entry.sql)),
      false,
      'The tracker should not depend on an executed_at lookup'
    );
  } finally {
    pool.connect = originalConnect;
    delete require.cache[require.resolve('../config/migrationTracker')];
  }
});
