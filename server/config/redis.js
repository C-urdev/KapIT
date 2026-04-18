const { createClient } = require('redis');

let client;
let connectPromise;
let warnedMissingUrl = false;
let unavailableUntil = 0;
let lastUnavailableLogAt = 0;

const getRedisUrl = () => String(process.env.REDIS_URL || '').trim();
const getConnectTimeoutMs = () => Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 750);
const getFailOpenCooldownMs = () => Number(process.env.REDIS_FAILOPEN_COOLDOWN_MS || 30000);
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
  console.warn(
    `Redis unavailable (${message}). Rate limiting will run in fail-open mode for ${Math.ceil(cooldownMs / 1000)}s.`
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

const getRedisClient = async () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    if (!warnedMissingUrl) {
      warnedMissingUrl = true;
      const message = 'REDIS_URL is not configured. Rate limiting will run in fail-open mode.';
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
};
