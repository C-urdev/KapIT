const { logger } = require('../config/logger');
const { hasILovePdfCredentials, convertDocxToPdfViaILovePdf } = require('./resumeOptimizationService');

const isEnabled = () => String(process.env.ILOVEPDF_ENABLED || '').toLowerCase() === 'true';
const maxRetries = Math.max(1, Number(process.env.ILOVEPDF_RETRIES || 2));
const timeoutMs = Math.max(5000, Number(process.env.ILOVEPDF_TIMEOUT_MS || 15000));

// Basic Circuit Breaker
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_COOLDOWN_MS = 15 * 60 * 1000; // 15 mins

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`iLovePDF timeout after ${ms}ms`)), ms);
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

const convertDocxToPdf = async ({ docxAbsolutePath, context = {} }) => {
  if (!isEnabled() || !hasILovePdfCredentials()) {
    return { ok: false, reason: 'ilovepdf_disabled_or_unconfigured' };
  }

  if (Date.now() < circuitOpenUntil) {
    logger.warn({ context, consecutiveFailures }, 'resume.pdf-conversion.circuit-open');
    return { ok: false, reason: 'ilovepdf_circuit_breaker_open' };
  }

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const buffer = await withTimeout(convertDocxToPdfViaILovePdf({ docxAbsolutePath }), timeoutMs);
      
      // Success resets the breaker
      consecutiveFailures = 0;
      circuitOpenUntil = 0;

      return { ok: true, buffer, provider: 'ilovepdf' };
    } catch (error) {
      lastError = error;
      logger.warn(
        { attempt, maxRetries, context, error: error?.message || String(error) },
        'resume.pdf-conversion.retry'
      );
    }
  }

  // Failed all retries
  consecutiveFailures += 1;
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    logger.error({ context, consecutiveFailures, cooldownMs: CIRCUIT_COOLDOWN_MS }, 'resume.pdf-conversion.circuit-tripped');
  } else {
    logger.error(
      { context, error: lastError?.message || String(lastError) },
      'resume.pdf-conversion.failed'
    );
  }

  return { ok: false, reason: 'ilovepdf_failed', error: lastError?.message || 'PDF conversion failed' };
};

module.exports = {
  convertDocxToPdf,
};
