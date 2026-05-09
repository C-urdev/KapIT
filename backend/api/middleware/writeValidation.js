const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const validateWriteRequests = (req, res, next) => {
  const method = String(req.method || '').toUpperCase();
  if (!WRITE_METHODS.has(method)) {
    return next();
  }

  // Allow form-encoded payloads only where explicitly used.
  const contentType = String(req.get('content-type') || '').toLowerCase();
  const hasBody = req.headers['content-length'] !== '0' && req.body !== undefined;
  const jsonLike = contentType.includes('application/json');
  const formLike = contentType.includes('application/x-www-form-urlencoded');

  if (hasBody && contentType && !jsonLike && !formLike) {
    return res.status(415).json({
      success: false,
      error: 'Unsupported content type.',
    });
  }

  if (req.body != null && typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request payload.',
    });
  }

  return next();
};

module.exports = {
  validateWriteRequests,
};
