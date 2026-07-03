const { logger } = require('./logger');

/**
 * Standardized security event logger for operational monitoring.
 * Outputs a structured JSON payload designed to be picked up by SIEMs or external loggers (e.g. Datadog, Sentry).
 */
const logSecurityViolation = ({
  type,
  req = {},
  userId = 'anonymous',
  reason,
  intent,
  extra = {},
}: {
  type: string;
  req?: { ip?: string; headers?: Record<string, any> };
  userId?: string | number;
  reason?: string;
  intent?: string;
  extra?: Record<string, any>;
}) => {
  const payload = {
    event: type,
    userId: String(userId),
    ip: req.ip || 'unknown',
    userAgent: req.headers?.['user-agent'] || 'unknown',
    intent: intent || 'unknown_intent',
    reason: reason || 'Violation detected',
    timestamp: new Date().toISOString(),
    ...extra,
  };

  logger.warn(payload, `security_event:${type}`);
};

module.exports = {
  logSecurityViolation,
};
