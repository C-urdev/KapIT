import { apiRequest } from './apiClient';

const FALLBACK_ERROR_REPLY = 'Something went wrong on our side. Please try again in a moment.';
const ALLOWED_ACTION_TYPES = new Set(['navigate']);

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

export const requestChatbotMessage = async (message, context = {}) => {
  const rawMessage = String(message || '').trim();
  const lastIntent = String(context?.lastIntent || '').trim().toLowerCase();
  if (!rawMessage) {
    throw new Error('Chatbot message is required.');
  }
  const payload = await apiRequest('/public/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({
      message: rawMessage,
      ...(lastIntent ? { lastIntent } : {}),
    }),
    retryOnUnauthorized: false,
    retryOnRouterExternalError: false,
  });

  return {
    reply: String(payload?.reply || '').trim() || FALLBACK_ERROR_REPLY,
    intent: String(payload?.intent || 'fallback').trim() || 'fallback',
    confidence: Number.isFinite(Number(payload?.confidence)) ? Number(payload.confidence) : 0,
    actions: sanitizeActions(payload?.actions),
  };
};
