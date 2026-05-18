const PAYPAL_ISSUE_MESSAGE_MAP = Object.freeze({
  PAYEE_ACCOUNT_NOT_VERIFIED:
    'Payments are temporarily unavailable because the merchant PayPal account is not verified yet. Please try again later or contact support.',
  PAYEE_ACCOUNT_RESTRICTED:
    'Payments are temporarily unavailable because the merchant PayPal account is restricted. Please try again later or contact support.',
  PAYEE_ACCOUNT_LOCKED_OR_CLOSED:
    'Payments are temporarily unavailable because the merchant PayPal account is locked or closed. Please try again later or contact support.',
  PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING:
    'This PayPal account is not enabled for card processing yet. Please try again later or contact support.',
  PAYEE_ACCOUNT_INVALID:
    'Payments are temporarily unavailable because the merchant PayPal account setup is invalid. Please try again later or contact support.',
  PERMISSION_DENIED:
    'Payment setup is not complete yet. Please try again later or contact support.',
  INSTRUMENT_DECLINED:
    'Your payment method was declined by PayPal. Please choose another method or try again.',
  PAYER_ACTION_REQUIRED:
    'PayPal needs an extra confirmation step. Please reopen checkout and complete verification in PayPal.',
  ORDER_ALREADY_CAPTURED:
    'This PayPal order was already completed. Please refresh and check your account status.',
  ORDER_NOT_APPROVED:
    'This PayPal order is not approved yet. Please approve it in PayPal and try again.',
  ORDER_ALREADY_AUTHORIZED:
    'This PayPal order is already authorized. Please try again or create a new checkout session.',
  CURRENCY_NOT_SUPPORTED:
    'PayPal cannot process this currency for the current account configuration. Please contact support.',
  TRANSACTION_REFUSED:
    'PayPal refused this transaction. Please try another payment method or try again later.',
  UNPROCESSABLE_ENTITY:
    'PayPal could not process this payment request. Please try again later.',
});

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const readIssueFromError = (error) => {
  const detailIssue = String(error?.data?.details?.[0]?.issue || '').trim().toUpperCase();
  if (detailIssue) {
    return detailIssue;
  }

  const message = normalizeText(error?.message || '');
  if (!message) {
    return '';
  }

  const explicitMatch = message.match(/issue=([A-Z0-9_]+)/i);
  if (explicitMatch?.[1]) {
    return explicitMatch[1].toUpperCase();
  }

  const known = Object.keys(PAYPAL_ISSUE_MESSAGE_MAP).find((code) => message.toUpperCase().includes(code));
  return known || '';
};

const stripProviderDebugFragments = (rawMessage) => {
  const message = normalizeText(rawMessage);
  if (!message) {
    return '';
  }

  return message
    .replace(/\s*\(.*debug_id=[^)]+\)/gi, '')
    .replace(/\s*\(.*issue=[^)]+\)/gi, '')
    .replace(/\s*issue=[A-Z0-9_]+/gi, '')
    .replace(/\s*debug_id=[A-Za-z0-9_-]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const getPaymentErrorMessageForUser = (
  error,
  fallback = 'Unable to start the payment flow.'
) => {
  const status = Number(error?.status || 0);
  if (status === 401) {
    return 'Your session expired. Please log in again, then retry payment.';
  }

  if (status === 429) {
    return 'Too many payment attempts in a short time. Please wait a moment and try again.';
  }

  const issueCode = readIssueFromError(error);
  if (issueCode && PAYPAL_ISSUE_MESSAGE_MAP[issueCode]) {
    return PAYPAL_ISSUE_MESSAGE_MAP[issueCode];
  }

  if (status === 502 || status === 503) {
    return 'Payment provider is temporarily unavailable. Please try again in a minute.';
  }

  const sanitized = stripProviderDebugFragments(error?.message || '');
  if (sanitized) {
    return sanitized;
  }

  return fallback;
};

