const FALLBACK_REPLY = 'I can help with accounts, jobs, resumes, pricing, and support. What would you like to do?';

const INTENT_DEFINITIONS = [
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    reply: 'Hi. How can I help you today?',
  },
  {
    intent: 'upload-resume',
    keywords: ['upload resume', 'resume upload', 'upload cv', 'add resume', 'resume'],
    reply: 'You can upload your resume from onboarding or profile settings, then save changes.',
    actions: [{ type: 'navigate', label: 'Open profile settings', href: '/dashboard/user' }],
  },
  {
    intent: 'apply-job',
    keywords: ['apply for job', 'how to apply', 'job application', 'apply job'],
    reply: 'Open Jobs, choose a role, review requirements, and click Apply.',
    actions: [{ type: 'navigate', label: 'Browse jobs', href: '/jobs' }],
  },
  {
    intent: 'reset-password',
    keywords: ['forgot password', 'reset password', 'password reset'],
    reply: 'Use Forgot Password, enter your email, then follow the reset link.',
    actions: [{ type: 'navigate', label: 'Reset password', href: '/forgot-password' }],
  },
  {
    intent: 'pricing',
    keywords: ['pricing', 'premium', 'subscription', 'billing', 'payment'],
    reply: 'You can compare plans and billing details on the pricing page.',
    actions: [{ type: 'navigate', label: 'View pricing', href: '/pricing' }],
  },
  {
    intent: 'support',
    keywords: ['support', 'help', 'contact support', 'human support'],
    reply: 'For account-specific help, contact support through the platform support channel.',
    actions: [{ type: 'navigate', label: 'Open help', href: '/company/help' }],
  },
];

const normalizeInput = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const isFollowUpQuestion = (value) => {
  const normalized = normalizeInput(value);
  return ['where', 'where?', 'huh', 'huh?', '?', '??'].includes(normalized);
};

const includesKeyword = (message, keyword) => message.includes(normalizeInput(keyword));

const pickFallbackIntentByLastIntent = (lastIntent) => {
  const normalized = normalizeInput(lastIntent);
  if (!normalized) return null;
  return INTENT_DEFINITIONS.find((item) => item.intent === normalized) || null;
};

const resolveLocalChatbotFallback = ({ message, lastIntent }) => {
  const normalizedMessage = normalizeInput(message);
  const followUpIntent = pickFallbackIntentByLastIntent(lastIntent);

  if (followUpIntent && isFollowUpQuestion(normalizedMessage)) {
    return {
      reply: followUpIntent.reply,
      intent: followUpIntent.intent,
      confidence: 0.9,
      actions: Array.isArray(followUpIntent.actions) ? followUpIntent.actions : [],
    };
  }

  for (const definition of INTENT_DEFINITIONS) {
    const matched = definition.keywords.some((keyword) => includesKeyword(normalizedMessage, keyword));
    if (!matched) continue;

    return {
      reply: definition.reply,
      intent: definition.intent,
      confidence: 0.85,
      actions: Array.isArray(definition.actions) ? definition.actions : [],
    };
  }

  return {
    reply: FALLBACK_REPLY,
    intent: 'fallback',
    confidence: 0,
    actions: [],
  };
};

module.exports = {
  FALLBACK_REPLY,
  resolveLocalChatbotFallback,
};

