const crypto = require('crypto');

const tokensMatch = (providedToken, configuredToken) => {
  const provided = Buffer.from(String(providedToken || ''), 'utf8');
  const configured = Buffer.from(String(configuredToken || ''), 'utf8');
  if (provided.length !== configured.length) {
    return false;
  }
  return crypto.timingSafeEqual(provided, configured);
};

const requireMessagingDebugAccess = (req, res, next) => {
  const configuredToken = String(process.env.MESSAGING_DEBUG_TOKEN || '').trim();
  const requestToken = String(req.get('x-messaging-debug-token') || '').trim();

  // Deny by default in every environment unless explicitly configured.
  if (configuredToken && tokensMatch(requestToken, configuredToken)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Messaging debug access denied.',
  });
};

module.exports = {
  requireMessagingDebugAccess,
};
