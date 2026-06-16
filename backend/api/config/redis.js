const { createClient } = require('redis');

let client;
let connectPromise;
let warnedMissingUrl = false;
let unavailableUntil = 0;
let lastUnavailableLogAt = 0;

const getRedisUrl = () => String(process.env.REDIS_URL || '').trim();
const getConnectTimeoutMs = () => Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 750);
const getFailOpenCooldownMs = () => Number(process.env.REDIS_FAILOPEN_COOLDOWN_MS || 30000);
const isDevelopment = () => String(process.env.NODE_ENV || '').toLowerCase() === 'development';
const shouldLogRedisStatus = () => {
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    return true;
  }
  return String(process.env.LOG_REDIS_STATUS || '').toLowerCase() === 'true';
};

const now = () => Date.now();

const logRedisUnavailable = (error) => {
  if (!shouldLogRedisStatus()) {
    return;
  }

  const current = now();
  const cooldownMs = getFailOpenCooldownMs();
  if (current - lastUnavailableLogAt < cooldownMs) {
    return;
  }

  lastUnavailableLogAt = current;
  const message = error?.message || String(error || 'unknown error');
  const log = isDevelopment() ? console.info : console.warn;
  log(
    `Redis unavailable (${message}). Rate limiting will use in-memory fallback for ${Math.ceil(cooldownMs / 1000)}s.`
  );
};

const resetRedisClient = () => {
  if (client) {
    try {
      client.destroy();
    } catch {
      // ignore cleanup errors
    }
  }

  client = undefined;
};

const markRedisUnavailable = (error) => {
  unavailableUntil = now() + getFailOpenCooldownMs();
  logRedisUnavailable(error);
  resetRedisClient();
};

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Redis connect timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const logRedisStartupStatus = async () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    const log = isDevelopment() ? console.info : console.warn;
    log('Redis startup: REDIS_URL is missing. Rate limiting uses in-memory fallback and payment checkout idempotency is disabled.');
    return { hasRedisUrl: false, connected: false };
  }

  try {
    const redis = await getRedisClient();
    if (redis) {
      console.info('Redis startup: REDIS_URL is set and Redis is connected.');
      return { hasRedisUrl: true, connected: true };
    }
  } catch (error) {
    markRedisUnavailable(error);
  }

  const log = isDevelopment() ? console.info : console.warn;
  log('Redis startup: REDIS_URL is set but Redis is unavailable. Rate limiting uses in-memory fallback and payment checkout is temporarily blocked.');
  return { hasRedisUrl: true, connected: false };
};

const getRedisClient = async () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!warnedMissingUrl) {
      warnedMissingUrl = true;
      const message = 'REDIS_URL is not configured. Rate limiting will use in-memory fallback.';
      const env = String(process.env.NODE_ENV || '').toLowerCase();
      if (env === 'production') {
        console.warn(message);
      } else if (process.env.LOG_REDIS_STATUS === 'true') {
        console.info(message);
      }
    }
    return null;
  }

  if (now() < unavailableUntil) {
    return null;
  }

  if (!client) {
    try {
      client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: getConnectTimeoutMs(),
          reconnectStrategy: () => false,
        },
        disableOfflineQueue: true,
      });
      client.on('error', (error) => {
        logRedisUnavailable(error);
      });
    } catch (error) {
      markRedisUnavailable(error);
      return null;
    }
  }

  if (!client.isOpen) {
    if (!connectPromise) {
      connectPromise = withTimeout(client.connect(), getConnectTimeoutMs())
        .then(() => client)
        .catch((error) => {
          markRedisUnavailable(error);
          return null;
        })
        .finally(() => {
          connectPromise = null;
        });
    }
    const connectedClient = await connectPromise;
    if (!connectedClient || !connectedClient.isOpen) {
      return null;
    }
  }

  return client;
};

const closeRedisClient = async () => {
  if (!client || !client.isOpen) {
    return;
  }

  try {
    await client.quit();
  } catch {
    client.destroy();
  } finally {
    client = undefined;
  }
};

module.exports = {
  getRedisClient,
  closeRedisClient,
  logRedisStartupStatus,
};
