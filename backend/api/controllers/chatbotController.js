const { logger } = require('../config/logger');
const { getChatbotReply } = require('../services/aiService');

const getSafeFallbackPayload = () => ({
  reply: 'Something went wrong on our side. Please try again in a moment.',
  intent: 'fallback',
  confidence: 0,
  actions: [],
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
    logger.warn({ err: error }, 'Chatbot API request failed');
    const safe = getSafeFallbackPayload();
    return res.status(502).json({
      success: false,
      ...safe,
    });
  }
};

module.exports = {
  sendChatbotMessage,
};
