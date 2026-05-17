const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const { InputValidationError, sanitizeAndValidateInput } = require('./inputSanitizer');

const getBodySanitizerLimits = () => ({
  maxDepth: Number(process.env.INPUT_MAX_DEPTH || 12),
  maxObjectKeys: Number(process.env.INPUT_MAX_OBJECT_KEYS || 120),
  maxTotalKeys: Number(process.env.INPUT_MAX_TOTAL_KEYS || 800),
  maxArrayLength: Number(process.env.INPUT_MAX_ARRAY_LENGTH || 200),
  maxStringLength: Number(process.env.INPUT_MAX_STRING_LENGTH || 8000),
  maxKeyLength: Number(process.env.INPUT_MAX_KEY_LENGTH || 120),
  maxNodes: Number(process.env.INPUT_MAX_NODES || 3000),
});

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

  if (req.body != null && typeof req.body === 'object') {
    try {
      req.body = sanitizeAndValidateInput(req.body, getBodySanitizerLimits());
    } catch (error) {
      if (error instanceof InputValidationError) {
        return res.status(Number(error.statusCode || 400)).json({
          success: false,
          error: 'Invalid request payload.',
          details: [
            {
              path: error.path || '',
              code: error.code || 'invalid_input',
              message: error.message,
            },
          ],
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload.',
      });
    }
  }

  return next();
};

module.exports = {
  validateWriteRequests,
};
