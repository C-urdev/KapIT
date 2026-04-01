const requireMessagingDebugAccess = (req, res, next) => {
  const configuredToken = String(process.env.MESSAGING_DEBUG_TOKEN || '').trim();
  const requestToken = String(req.get('x-messaging-debug-token') || req.query.debugToken || '').trim();
  const isNonProduction = process.env.NODE_ENV !== 'production';

  if (configuredToken && requestToken === configuredToken) {
    return next();
  }

  if (isNonProduction) {
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
