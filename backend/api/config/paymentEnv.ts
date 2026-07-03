const PLACEHOLDER_VALUE_PATTERN = /^(<[^>]+>|your-|replace-|change-this|changeme|example|placeholder)/i;

const PAYMENT_ENV_KEYS = Object.freeze({
  payPalClientId: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENTID', 'PAYPAL_ID'],
  payPalClientSecret: ['PAYPAL_CLIENT_SECRET', 'PAYPAL_CLIENTSECRET', 'PAYPAL_SECRET'],
  payPalWebhookId: ['PAYPAL_WEBHOOK_ID'],
});

const sanitizeEnvValue = (value: unknown): string => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }
  if (PLACEHOLDER_VALUE_PATTERN.test(normalized)) {
    return '';
  }
  return normalized;
};

const readFirstResolved = (keys: readonly string[]): string => {
  for (const key of keys) {
    const value = sanitizeEnvValue(process.env[key]);
    if (value) {
      return value;
    }
  }
  return '';
};

const getPayPalClientId = (): string => readFirstResolved(PAYMENT_ENV_KEYS.payPalClientId);
const getPayPalClientSecret = (): string => readFirstResolved(PAYMENT_ENV_KEYS.payPalClientSecret);
const getPayPalWebhookId = (): string => readFirstResolved(PAYMENT_ENV_KEYS.payPalWebhookId);

const hasPayPalConfig = (): boolean => Boolean(getPayPalClientId() && getPayPalClientSecret());

module.exports = {
  PAYMENT_ENV_KEYS,
  sanitizeEnvValue,
  getPayPalClientId,
  getPayPalClientSecret,
  getPayPalWebhookId,
  hasPayPalConfig,
};
