const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const pool = require('../config/database');
const {
  isDatabaseConnectivityError,
  summarizeDatabaseConnectivityError,
} = require('../config/database');
const { logger } = require('../config/logger');
const { startPasswordResetCleanupJob } = require('../services/authService');

const waitForImmediateWork = () => new Promise((resolve) => setTimeout(resolve, 25));
const serverRoot = path.resolve(__dirname, '..');

const mockServerModule = (relativePath, exportsValue) => {
  const modulePath = require.resolve(path.join(serverRoot, relativePath));
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  } as NodeJS.Module;
};

const loadResumeCleanupServiceForTest = () => {
  delete require.cache[require.resolve('../services/resumeCleanupService')];
  mockServerModule('config/runtimeSchema.ts', {
    ensureResumeSchemaReady: async () => {},
  });
  return require('../services/resumeCleanupService');
};

const createConnectivityAggregateError = () => {
  const nestedError = Object.assign(new Error('connect EACCES 127.0.0.1:5432'), { code: 'EACCES' });
  const error = new AggregateError([nestedError], 'database unavailable') as AggregateError & { code: string };
  error.code = 'EACCES';
  return error;
};

test('database connectivity helper recognizes aggregate connection failures', () => {
  const error = createConnectivityAggregateError();

  assert.equal(isDatabaseConnectivityError(error), true);
  assert.match(summarizeDatabaseConnectivityError(error), /EACCES/);
});

test('password reset cleanup logs a single warning for temporary database connectivity issues', async () => {
  const originalQuery = pool.query;
  const originalWarn = logger.warn;
  const originalError = logger.error;
  const warnCalls = [];
  const errorCalls = [];

  pool.query = async () => {
    throw createConnectivityAggregateError();
  };
  logger.warn = (...args) => warnCalls.push(args);
  logger.error = (...args) => errorCalls.push(args);

  try {
    const stopJob = startPasswordResetCleanupJob();
    await waitForImmediateWork();
    stopJob();

    assert.equal(
      warnCalls.some(([, message]) =>
        String(message).includes('Password reset cleanup skipped because the database is temporarily unavailable.')
      ),
      true
    );
    assert.equal(
      errorCalls.some(([, message]) => String(message).includes('Password reset token cleanup failed.')),
      false
    );
  } finally {
    pool.query = originalQuery;
    logger.warn = originalWarn;
    logger.error = originalError;
  }
});

test('password reset cleanup skips missing password_reset_tokens table without logging an error', async () => {
  const originalQuery = pool.query;
  const originalWarn = logger.warn;
  const originalError = logger.error;
  const warnCalls = [];
  const errorCalls = [];

  pool.query = async () => {
    const error = new Error('relation "password_reset_tokens" does not exist');
    (error as NodeJS.ErrnoException).code = '42P01';
    throw error;
  };
  logger.warn = (...args) => warnCalls.push(args);
  logger.error = (...args) => errorCalls.push(args);

  try {
    const stopJob = startPasswordResetCleanupJob();
    await waitForImmediateWork();
    stopJob();

    assert.equal(warnCalls.length, 0);
    assert.equal(
      errorCalls.some(([, message]) => String(message).includes('Password reset token cleanup failed.')),
      false
    );
  } finally {
    pool.query = originalQuery;
    logger.warn = originalWarn;
    logger.error = originalError;
  }
});

test('resume cleanup logs a single warning for temporary database connectivity issues', async () => {
  const originalQuery = pool.query;
  const originalWarn = logger.warn;
  const originalError = logger.error;
  const warnCalls = [];
  const errorCalls = [];
  const { startResumeCleanupJob, __resetResumeCleanupWarningForTests } = loadResumeCleanupServiceForTest();
  __resetResumeCleanupWarningForTests();

  pool.query = async () => {
    throw createConnectivityAggregateError();
  };
  logger.warn = (...args) => warnCalls.push(args);
  logger.error = (...args) => errorCalls.push(args);

  try {
    const stopJob = startResumeCleanupJob();
    await waitForImmediateWork();
    stopJob();

    assert.equal(
      warnCalls.some(([, message]) =>
        String(message).includes('Resume cleanup skipped because the database is temporarily unavailable.')
      ),
      true
    );
    assert.equal(
      errorCalls.some(([, message]) => String(message).includes('resume.cleanup.failed')),
      false
    );
  } finally {
    pool.query = originalQuery;
    logger.warn = originalWarn;
    logger.error = originalError;
  }
});
