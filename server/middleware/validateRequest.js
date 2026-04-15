const { ZodError, z } = require('zod');

const formatValidationError = (error) => {
  if (!(error instanceof ZodError)) {
    return [];
  }

  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
};

const validateRequest = (schema) => (req, res, next) => {
  try {
    const effectiveSchema = typeof schema?.parse === 'function' ? schema : z.object(schema);
    const parsed = effectiveSchema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });

    req.body = parsed.body;
    req.params = parsed.params;
    req.query = parsed.query;
    return next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'validation error',
      details: formatValidationError(error),
    });
  }
};

module.exports = {
  validateRequest,
};
