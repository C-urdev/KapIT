import { CHATBOT_FALLBACK_RESPONSE, FAQ_ENTRIES } from '@shared/data/chatbotFaq';

const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const resolveChatbotReply = (userMessage) => {
  const normalizedMessage = normalize(userMessage);
  if (!normalizedMessage) {
    return CHATBOT_FALLBACK_RESPONSE;
  }

  const matchedEntry = FAQ_ENTRIES.find((entry) =>
    entry.keywords.some((keyword) => normalizedMessage.includes(normalize(keyword)))
  );

  return matchedEntry?.response || CHATBOT_FALLBACK_RESPONSE;
};
