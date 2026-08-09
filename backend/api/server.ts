// @ts-nocheck
const { initEnvironment } = require('./config/env.ts');
initEnvironment();

const { createApp, ensureSchemaReady } = require('./app');
const { isDatabaseConnectivityError, summarizeDatabaseConnectivityError } = require('./config/database');
const pool = require('./config/database');
const { closeRedisClient, logRedisStartupStatus } = require('./config/redis');
const { installConsoleBridge } = require('./config/logger');
const { startPasswordResetCleanupJob } = require('./services/authService');
const { startResumeWorker, stopResumeWorker } = require('./queues/resumeQueue');
const { startResumeCleanupJob } = require('./services/resumeCleanupService');

installConsoleBridge();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;
const QUIET_STARTUP = process.env.QUIET_STARTUP === 'true';
const IS_PRODUCTION = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const app = createApp();
const stopPasswordResetCleanupJob = startPasswordResetCleanupJob();
const stopResumeCleanupJob = startResumeCleanupJob();
startResumeWorker();
let isShuttingDown = false;
let activePort = Number(PORT);
let listenAttempts = 0;
const MAX_PORT_RETRIES = Math.max(0, Number(process.env.PORT_FALLBACK_MAX_ATTEMPTS || 20));
const warmSchemasInBackground = async () => {
  try {
    await ensureSchemaReady();
    if (!QUIET_STARTUP) {
      console.log('Runtime schema warmup complete');
    }
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn(`Runtime schema warmup skipped: ${summarizeDatabaseConnectivityError(error)}.`);
      return;
    }
    console.warn('Continuing without schema bootstrap (profile saving may fail).');
    console.warn(error?.message || error);
  }
};

const onListen = () => {
  if (QUIET_STARTUP) {
    return;
  }

  if (HOST) {
    console.log(`Server running on http://${HOST}:${activePort}`);
    return;
  }

  console.log(`Server running on port ${activePort}`);
};

const startListening = () => {
  const serverInstance = HOST ? app.listen(activePort, HOST, onListen) : app.listen(activePort, onListen);

  serverInstance.once('error', (error) => {
    if (isShuttingDown) {
      return;
    }

    if (error?.code !== 'EADDRINUSE') {
      console.error('Server failed to start:', error?.message || error);
      process.exit(1);
      return;
    }

    if (IS_PRODUCTION) {
      console.error(`Port ${activePort} is in use. Aborting because production must stay on the configured port.`);
      process.exit(1);
      return;
    }

    if (listenAttempts >= MAX_PORT_RETRIES) {
      console.error(
        `Port ${activePort} is in use and no free fallback port was found after ${MAX_PORT_RETRIES} retries.`,
      );
      process.exit(1);
      return;
    }

    const previousPort = activePort;
    listenAttempts += 1;
    activePort += 1;
    process.env.PORT = String(activePort);
    console.warn(`Port ${previousPort} is in use. Retrying on port ${activePort}.`);
    server = startListening();
  });

  return serverInstance;
};

let server = startListening();
void logRedisStartupStatus();

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  if (!QUIET_STARTUP) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
  }

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, Number(process.env.SHUTDOWN_TIMEOUT_MS || 15000));
  forceExitTimer.unref();

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    stopPasswordResetCleanupJob();
    stopResumeCleanupJob();
    await Promise.allSettled([stopResumeWorker(), pool.end(), closeRedisClient()]);

    if (!QUIET_STARTUP) {
      console.log('Graceful shutdown complete.');
    }
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error('Graceful shutdown failed:', error?.message || error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

void warmSchemasInBackground();
