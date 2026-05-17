const normalizeKey = (value) => String(value || '').trim();

const hydrateIdempotencyKeyFromHeader = (req, _res, next) => {
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
