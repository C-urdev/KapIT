const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const dotenv = require('dotenv');

test('env loader checks backend and repo-root env files', async () => {
  const modulePath = require.resolve('../config/env');
  delete require.cache[modulePath];

  const backendEnv = path.resolve(__dirname, '..', '..', '.env');
  const backendEnvLocal = path.resolve(__dirname, '..', '..', '.env.local');
  const repoEnv = path.resolve(__dirname, '..', '..', '..', '.env');
  const repoEnvLocal = path.resolve(__dirname, '..', '..', '..', '.env.local');

  const originalConfig = dotenv.config;
  const calls = [];

  try {
    dotenv.config = (options = {}) => {
      calls.push({ ...options });
      return { parsed: {} };
    };

    const env = require('../config/env');
    env.loadEnvironmentFiles();

    const seen = new Set(calls.map((call) => path.normalize(call.path || '')));
    assert.ok(seen.has(path.normalize(backendEnv)));
    assert.ok(seen.has(path.normalize(backendEnvLocal)));
    assert.ok(seen.has(path.normalize(repoEnv)));
    assert.ok(seen.has(path.normalize(repoEnvLocal)));
  } finally {
    dotenv.config = originalConfig;
    delete require.cache[modulePath];
  }
});
