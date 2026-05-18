const { logger } = require('../config/logger');
const { getChatbotReply } = require('../services/aiService');
const { resolveLocalChatbotFallback } = require('../services/chatbotFallbackService');

const getSafeFallbackPayload = () => ({
  reply: 'Something went wrong on our side. Please try again in a moment.',
  intent: 'fallback',
  confidence: 0,
  actions: [],
});

const getUpstreamErrorSummary = (error) => ({
  statusCode: Number.isFinite(Number(error?.statusCode)) ? Number(error.statusCode) : null,
  code: String(error?.code || '').trim() || null,
  message: String(error?.message || '').trim() || 'Unknown chatbot upstream error',
});

const resolveChatbotMode = () =>
  String(process.env.CHATBOT_PROVIDER || process.env.CHATBOT_MODE || 'auto').trim().toLowerCase();

const sendChatbotMessage = async (req, res) => {
  const payload = req.body || {};
  const message = String(payload.message || '').trim();
  const lastIntent = String(payload.lastIntent || '').trim().toLowerCase();
  const mode = resolveChatbotMode();

  if (mode === 'local') {
    const local = resolveLocalChatbotFallback({ message, lastIntent });
    res.setHeader('X-Chatbot-Mode', 'local');
    return res.status(200).json({
      success: true,
      local: true,
      ...local,
    });
  }

  try {
    const response = await getChatbotReply({ message, lastIntent });

    res.setHeader('X-Chatbot-Mode', 'fastapi');
    return res.json({
      success: true,
      reply: String(response?.reply || '').trim() || getSafeFallbackPayload().reply,
      intent: String(response?.intent || 'fallback').trim() || 'fallback',
      confidence: Number.isFinite(Number(response?.confidence)) ? Number(response.confidence) : 0,
      actions: Array.isArray(response?.actions) ? response.actions : [],
    });
  } catch (error) {
    logger.warn(
      {
        err: error,
        upstream: getUpstreamErrorSummary(error),
      },
      'Chatbot API upstream failed; returning safe fallback response'
    );
    const safe = resolveLocalChatbotFallback({ message, lastIntent });
    res.setHeader('X-Chatbot-Degraded', '1');
    res.setHeader('X-Chatbot-Mode', 'auto-fallback');
    return res.status(200).json({
      success: true,
      degraded: true,
      ...safe,
    });
  }
};

module.exports = {
  sendChatbotMessage,
};
