const { createApp, ensureSchemaReady } = require('./app');
const pool = require('./config/database');
const { closeRedisClient } = require('./config/redis');
const { installConsoleBridge } = require('./config/logger');
const { startPasswordResetCleanupJob } = require('./services/authService');

installConsoleBridge();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;
const QUIET_STARTUP = process.env.QUIET_STARTUP === 'true';
const app = createApp();
const stopPasswordResetCleanupJob = startPasswordResetCleanupJob();
let isShuttingDown = false;
const warmSchemasInBackground = async () => {
  try {
    await ensureSchemaReady();
    if (!QUIET_STARTUP) {
      console.log('Runtime schema warmup complete');
    }
  } catch (error) {
    console.warn('Continuing without schema bootstrap (profile saving may fail).');
    console.warn(error?.message || error);
  }
};

const onListen = () => {
  if (QUIET_STARTUP) {
    return;
  }

  if (HOST) {
    console.log(`Server running on http://${HOST}:${PORT}`);
    return;
  }

  console.log(`Server running on port ${PORT}`);
};

const server = HOST ? app.listen(PORT, HOST, onListen) : app.listen(PORT, onListen);

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
    await Promise.allSettled([pool.end(), closeRedisClient()]);

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
