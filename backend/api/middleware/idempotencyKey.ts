import type { Request, Response, NextFunction } from 'express';

const normalizeKey = (value: unknown): string => String(value || '').trim();

const hydrateIdempotencyKeyFromHeader = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }

  const bodyKey = normalizeKey(req.body.idempotencyKey);
  if (bodyKey) {
    req.body.idempotencyKey = bodyKey;
    return next();
  }

  const headerKey = normalizeKey(req.get('x-idempotency-key'));
  if (headerKey) {
    req.body.idempotencyKey = headerKey;
  }

  return next();
};

module.exports = {
  hydrateIdempotencyKeyFromHeader,
};
