const { createClient } = require('redis');

let client;
let connectPromise;
let warnedMissingUrl = false;

const getRedisUrl = () => String(process.env.REDIS_URL || '').trim();

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

  if (!client) {
    client = createClient({ url: redisUrl });
    client.on('error', (error) => {
      console.error('Redis client error:', error?.message || error);
    });
  }

  if (!client.isOpen) {
    if (!connectPromise) {
      connectPromise = client.connect().finally(() => {
        connectPromise = null;
      });
    }
    await connectPromise;
  }

  return client;
};

const closeRedisClient = async () => {
  if (!client || !client.isOpen) {
    return;
  }

  await client.quit();
};

module.exports = {
  getRedisClient,
  closeRedisClient,
};
