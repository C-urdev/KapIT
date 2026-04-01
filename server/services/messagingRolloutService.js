const crypto = require('crypto');

const rolloutMetrics = {
  startedAt: new Date().toISOString(),
  conversationReadAttempts: 0,
  conversationReadServed: 0,
  conversationReadFallbacks: 0,
  emptyConversationThreads: 0,
  conversationListCountMismatches: 0,
  conversationThreadCountMismatches: 0,
  dualWriteFailures: 0,
  decisions: {
    query_override_conversations: 0,
    query_override_legacy: 0,
    env_force_conversations: 0,
    allowlist: 0,
    percentage: 0,
    legacy_default: 0,
  },
  fallbackReasons: {
    no_conversation_rows: 0,
    conversation_missing: 0,
    empty_conversation_messages: 0,
  },
};

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const parseAllowlist = () =>
  String(process.env.MESSAGES_READ_ALLOWLIST || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const getRolloutPercentage = () => {
  const parsed = Number(process.env.MESSAGES_READ_ROLLOUT_PERCENT || 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.trunc(parsed)));
};

const getStableBucket = (userId) => {
  const digest = crypto.createHash('sha256').update(String(userId || '')).digest('hex').slice(0, 8);
  return parseInt(digest, 16) % 100;
};

const recordMetric = (section, key) => {
  if (section) {
    rolloutMetrics[section][key] = Number(rolloutMetrics[section][key] || 0) + 1;
    return;
  }

  rolloutMetrics[key] = Number(rolloutMetrics[key] || 0) + 1;
};

const getMessagingRolloutConfig = () => ({
  sourceMode: String(process.env.MESSAGES_READ_SOURCE || 'legacy').trim().toLowerCase() || 'legacy',
  allowlistSize: parseAllowlist().length,
  rolloutPercentage: getRolloutPercentage(),
  shadowCompare: isTruthy(process.env.MESSAGES_READ_SHADOW_COMPARE),
});

const getConversationReadDecision = (req, user) => {
  const requestedSource = String(req?.query?.source || '').trim().toLowerCase();
  if (requestedSource === 'conversation' || requestedSource === 'conversations' || requestedSource === 'v2') {
    return { enabled: true, reason: 'query_override_conversations', bucket: null };
  }

  if (requestedSource === 'legacy' || requestedSource === 'messages') {
    return { enabled: false, reason: 'query_override_legacy', bucket: null };
  }

  const config = getMessagingRolloutConfig();
  if (config.sourceMode === 'conversations') {
    return { enabled: true, reason: 'env_force_conversations', bucket: null };
  }

  const userId = String(user?.id || '').trim();
  const userKeys = [
    userId,
    String(user?.username || '').trim().toLowerCase(),
    String(user?.email || '').trim().toLowerCase(),
  ].filter(Boolean);

  const allowlist = parseAllowlist();
  if (allowlist.length && userKeys.some((key) => allowlist.includes(String(key).toLowerCase()))) {
    return { enabled: true, reason: 'allowlist', bucket: null };
  }

  const percentage = getRolloutPercentage();
  if (percentage > 0 && userId) {
    const bucket = getStableBucket(userId);
    if (bucket < percentage) {
      return { enabled: true, reason: 'percentage', bucket };
    }
    return { enabled: false, reason: 'legacy_default', bucket };
  }

  return { enabled: false, reason: 'legacy_default', bucket: null };
};

const shouldShadowCompareConversationReads = () => isTruthy(process.env.MESSAGES_READ_SHADOW_COMPARE);

const recordConversationReadDecision = (decision) => {
  if (decision?.enabled) {
    recordMetric(null, 'conversationReadAttempts');
  }

  if (decision?.reason && Object.prototype.hasOwnProperty.call(rolloutMetrics.decisions, decision.reason)) {
    recordMetric('decisions', decision.reason);
  }
};

const recordConversationReadServed = () => {
  recordMetric(null, 'conversationReadServed');
};

const recordConversationReadFallback = (reason) => {
  recordMetric(null, 'conversationReadFallbacks');
  if (reason && Object.prototype.hasOwnProperty.call(rolloutMetrics.fallbackReasons, reason)) {
    recordMetric('fallbackReasons', reason);
  }
};

const recordEmptyConversationThread = () => {
  recordMetric(null, 'emptyConversationThreads');
};

const recordConversationListCountMismatch = () => {
  recordMetric(null, 'conversationListCountMismatches');
};

const recordConversationThreadCountMismatch = () => {
  recordMetric(null, 'conversationThreadCountMismatches');
};

const recordDualWriteFailure = () => {
  recordMetric(null, 'dualWriteFailures');
};

const getMessagingRolloutMetrics = () => ({
  ...rolloutMetrics,
  decisions: { ...rolloutMetrics.decisions },
  fallbackReasons: { ...rolloutMetrics.fallbackReasons },
});

module.exports = {
  getMessagingRolloutConfig,
  getMessagingRolloutMetrics,
  getConversationReadDecision,
  shouldShadowCompareConversationReads,
  recordConversationReadDecision,
  recordConversationReadServed,
  recordConversationReadFallback,
  recordEmptyConversationThread,
  recordConversationListCountMismatch,
  recordConversationThreadCountMismatch,
  recordDualWriteFailure,
};
