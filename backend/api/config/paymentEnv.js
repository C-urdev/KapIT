const PLACEHOLDER_VALUE_PATTERN = /^(<[^>]+>|your-|replace-|change-this|changeme|example|placeholder)/i;

const PAYMENT_ENV_KEYS = Object.freeze({
  payPalClientId: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENTID', 'PAYPAL_ID'],
  payPalClientSecret: ['PAYPAL_CLIENT_SECRET', 'PAYPAL_CLIENTSECRET', 'PAYPAL_SECRET'],
  payPalWebhookId: ['PAYPAL_WEBHOOK_ID'],
});

const sanitizeEnvValue = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }
  if (PLACEHOLDER_VALUE_PATTERN.test(normalized)) {
    return '';
  }
  return normalized;
};

const readFirstResolved = (keys) => {
  for (const key of keys) {
    const value = sanitizeEnvValue(process.env[key]);
    if (value) {
      return value;
    }
  }
  return '';
};

const getPayPalClientId = () => readFirstResolved(PAYMENT_ENV_KEYS.payPalClientId);
const getPayPalClientSecret = () => readFirstResolved(PAYMENT_ENV_KEYS.payPalClientSecret);
const getPayPalWebhookId = () => readFirstResolved(PAYMENT_ENV_KEYS.payPalWebhookId);

const hasPayPalConfig = () => Boolean(getPayPalClientId() && getPayPalClientSecret());

module.exports = {
  PAYMENT_ENV_KEYS,
  sanitizeEnvValue,
  getPayPalClientId,
  getPayPalClientSecret,
  getPayPalWebhookId,
  hasPayPalConfig,
};
