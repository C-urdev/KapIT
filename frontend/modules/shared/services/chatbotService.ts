// @ts-nocheck
import { apiRequest } from './apiClient';
import { resolveChatbotErrorResponse, resolveChatbotResponse } from '@sharedUtils/chatbotMatcher';

const FALLBACK_ERROR_REPLY = 'Something went wrong on our side. Please try again in a moment.';
const ALLOWED_ACTION_TYPES = new Set(['navigate']);
const CHATBOT_OUTAGE_COOLDOWN_MS = 90 * 1000;

let outageCooldownUntilMs = 0;
let consecutiveUpstreamFailures = 0;

const sanitizeActions = (actions) => {
  if (!Array.isArray(actions)) {
    return [];
  }

  return actions
    .map((action) => {
      const type = String(action?.type || '').trim().toLowerCase();
      const label = String(action?.label || '').trim();
      const href = String(action?.href || '').trim();
      if (!ALLOWED_ACTION_TYPES.has(type) || !label || !href.startsWith('/')) {
        return null;
      }
      return { type, label, href };
    })
    .filter(Boolean);
};

export const getChatbotErrorReply = () => FALLBACK_ERROR_REPLY;

const mapMatcherPayload = (userMessage, audience = 'general') => {
  const resolved = resolveChatbotResponse(userMessage, { audience });
  const resolvedIntent = String(resolved?.intentId || '').trim();
  const normalizedIntent =
    resolvedIntent && resolvedIntent !== 'nonsense'
      ? resolvedIntent
      : 'fallback';

  return {
    reply: String(resolved?.response || '').trim() || resolveChatbotErrorResponse(userMessage),
    intent: normalizedIntent,
    confidence: Number.isFinite(Number(resolved?.confidence)) ? Number(resolved.confidence) : 0,
    actions: [],
  };
};

const shouldTripOutageCooldown = (error) => {
  const status = Number(error?.status || 0);
  if (status >= 500) {
    return true;
  }

  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('request failed')
    || message.includes('router_external_target_error')
    || message.includes('connection was reset')
  );
};

export const requestChatbotMessage = async (message, context = {}) => {
  const rawMessage = String(message || '').trim();
  const lastIntent = String(context?.lastIntent || '').trim().toLowerCase();
  const audience = context?.audience === 'employer' ? 'employer' : 'general';
  if (!rawMessage) {
    throw new Error('Chatbot message is required.');
  }

  if (Date.now() < outageCooldownUntilMs) {
    return mapMatcherPayload(rawMessage, audience);
  }

  const payload = await apiRequest('/public/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({
      message: rawMessage,
      ...(lastIntent ? { lastIntent } : {}),
      audience,
    }),
    retryOnUnauthorized: false,
    retryOnRouterExternalError: false,
  }).catch((error) => {
    if (shouldTripOutageCooldown(error)) {
      consecutiveUpstreamFailures += 1;
      if (consecutiveUpstreamFailures >= 1) {
        outageCooldownUntilMs = Date.now() + CHATBOT_OUTAGE_COOLDOWN_MS;
      }
    }
    return mapMatcherPayload(rawMessage, audience);
  });

  outageCooldownUntilMs = 0;
  consecutiveUpstreamFailures = 0;

  return {
    reply: String(payload?.reply || '').trim() || FALLBACK_ERROR_REPLY,
    intent: String(payload?.intent || 'fallback').trim() || 'fallback',
    confidence: Number.isFinite(Number(payload?.confidence)) ? Number(payload.confidence) : 0,
    actions: sanitizeActions(payload?.actions),
  };
};
