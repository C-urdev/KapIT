const pino = require('pino');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
type NextFunction = import('express').NextFunction;
type Request = import('express').Request;
type Response = import('express').Response;
type AsyncLocalStorageType<T> = import('node:async_hooks').AsyncLocalStorage<T>;

const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const level = String(process.env.LOG_LEVEL || (isProduction ? 'info' : 'warn')).toLowerCase();
const requestContext: AsyncLocalStorageType<{ requestId: string }> = new AsyncLocalStorage();
const transientConsoleErrorCooldownMs = Math.max(
  1000,
  Number(process.env.TRANSIENT_CONSOLE_ERROR_COOLDOWN_MS || 30000)
);
let lastTransientConsoleErrorAt = 0;
const TRANSIENT_CONNECTIVITY_CODES = new Set([
  'EACCES',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
]);

const getNestedErrors = (value: unknown): unknown[] => {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray((value as { aggregateErrors?: unknown[] }).aggregateErrors)) {
    return (value as { aggregateErrors: unknown[] }).aggregateErrors;
  }

  if (value instanceof AggregateError && Array.isArray(value.errors)) {
    return value.errors;
  }

  return [];
};

const getTransientConnectivityCodes = (value: unknown, seen = new Set<unknown>()): string[] => {
  if (!value || seen.has(value)) {
    return [];
  }

  seen.add(value);
  const code = String((value as { code?: unknown })?.code || '').trim();
  const nestedCodes = getNestedErrors(value).flatMap((nested) => getTransientConnectivityCodes(nested, seen));

  if (code && TRANSIENT_CONNECTIVITY_CODES.has(code)) {
    return [code, ...nestedCodes];
  }

  return nestedCodes;
};

const normalizeBareAggregateConnectivityError = (args: unknown[]): string | null => {
  if (args.length !== 1) {
    return null;
  }

  const [value] = args;
  const name = String((value as { name?: unknown })?.name || '').trim();
  const message = String((value as { message?: unknown })?.message || '').trim();
  const isAggregateLike = name === 'AggregateError' || /^AggregateError\b/i.test(message) || value instanceof AggregateError;
  if (!isAggregateLike) {
    return null;
  }

  const codes = [...new Set(getTransientConnectivityCodes(value))];
  if (!codes.length) {
    return null;
  }

  return `Transient connectivity error (${codes.join(', ')}).`;
};

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
  console.log = (...args: unknown[]) => logger.info({ msg: args.map(String).join(' ') });
  console.info = (...args: unknown[]) => logger.info({ msg: args.map(String).join(' ') });
  console.warn = (...args: unknown[]) => logger.warn({ msg: args.map(String).join(' ') });
  console.error = (...args: unknown[]) => {
    const normalizedConnectivityError = normalizeBareAggregateConnectivityError(args);
    if (normalizedConnectivityError) {
      const current = Date.now();
      if (current - lastTransientConsoleErrorAt >= transientConsoleErrorCooldownMs) {
        lastTransientConsoleErrorAt = current;
        logger.warn({ msg: normalizedConnectivityError });
      }
      return;
    }
    logger.error({ msg: args.map(String).join(' ') });
  };
  console.debug = (...args: unknown[]) => logger.debug({ msg: args.map(String).join(' ') });
};

const requestContextMiddleware = (req: Request & { requestId?: string }, res: Response, next: NextFunction): void => {
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
