const pino = require('pino');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('node:async_hooks');

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const level = String(process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')).toLowerCase();
const requestContext = new AsyncLocalStorage();

const logger = pino({
  level,
  mixin() {
    const store = requestContext.getStore();
    if (!store?.requestId) {
      return {};
    }
    return { requestId: store.requestId };
  },
  base: {
    service: 'kapit-server',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

const installConsoleBridge = () => {
  console.log = (...args) => logger.info({ msg: args.map(String).join(' ') });
  console.info = (...args) => logger.info({ msg: args.map(String).join(' ') });
  console.warn = (...args) => logger.warn({ msg: args.map(String).join(' ') });
  console.error = (...args) => logger.error({ msg: args.map(String).join(' ') });
  console.debug = (...args) => logger.debug({ msg: args.map(String).join(' ') });
};

const requestContextMiddleware = (req, res, next) => {
  const requestId = String(req.get('x-request-id') || '').trim() || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  requestContext.run({ requestId }, next);
};

module.exports = {
  logger,
  installConsoleBridge,
  requestContextMiddleware,
};
