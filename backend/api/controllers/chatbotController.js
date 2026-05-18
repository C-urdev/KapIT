const { logger } = require('../config/logger');
const { getChatbotReply } = require('../services/aiService');

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

const sendChatbotMessage = async (req, res) => {
  try {
    const payload = req.body || {};
    const message = String(payload.message || '').trim();
    const lastIntent = String(payload.lastIntent || '').trim().toLowerCase();
    const response = await getChatbotReply({ message, lastIntent });

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
    const safe = getSafeFallbackPayload();
    res.setHeader('X-Chatbot-Degraded', '1');
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
