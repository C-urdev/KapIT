const { ZodError, z } = require('zod');
const { InputValidationError, sanitizeAndValidateInput } = require('./inputSanitizer');

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

const formatInputValidationError = (error) => {
  if (!(error instanceof InputValidationError)) {
    return [];
  }

  return [
    {
      path: error.path || '',
      code: error.code || 'invalid_input',
      message: error.message,
    },
  ];
};

const getBodySanitizerLimits = () => ({
  maxDepth: Number(process.env.INPUT_MAX_DEPTH || 12),
  maxObjectKeys: Number(process.env.INPUT_MAX_OBJECT_KEYS || 120),
  maxTotalKeys: Number(process.env.INPUT_MAX_TOTAL_KEYS || 800),
  maxArrayLength: Number(process.env.INPUT_MAX_ARRAY_LENGTH || 200),
  maxStringLength: Number(process.env.INPUT_MAX_STRING_LENGTH || 8000),
  maxKeyLength: Number(process.env.INPUT_MAX_KEY_LENGTH || 120),
  maxNodes: Number(process.env.INPUT_MAX_NODES || 3000),
});

const getQuerySanitizerLimits = () => ({
  maxDepth: Number(process.env.QUERY_INPUT_MAX_DEPTH || 4),
  maxObjectKeys: Number(process.env.QUERY_INPUT_MAX_OBJECT_KEYS || 80),
  maxTotalKeys: Number(process.env.QUERY_INPUT_MAX_TOTAL_KEYS || 200),
  maxArrayLength: Number(process.env.QUERY_INPUT_MAX_ARRAY_LENGTH || 30),
  maxStringLength: Number(process.env.QUERY_INPUT_MAX_STRING_LENGTH || 512),
  maxKeyLength: Number(process.env.QUERY_INPUT_MAX_KEY_LENGTH || 80),
  maxNodes: Number(process.env.QUERY_INPUT_MAX_NODES || 800),
});

const getParamSanitizerLimits = () => ({
  maxDepth: 2,
  maxObjectKeys: 20,
  maxTotalKeys: 40,
  maxArrayLength: 10,
  maxStringLength: Number(process.env.PARAM_INPUT_MAX_STRING_LENGTH || 256),
  maxKeyLength: 80,
  maxNodes: 200,
});

const validateRequest = (schema) => (req, res, next) => {
  try {
    const effectiveSchema = typeof schema?.parse === 'function' ? schema : z.object(schema);
    const sanitizedBody = sanitizeAndValidateInput(req.body, getBodySanitizerLimits());
    const sanitizedParams = sanitizeAndValidateInput(req.params, getParamSanitizerLimits());
    const sanitizedQuery = sanitizeAndValidateInput(req.query, getQuerySanitizerLimits());

    const parsed = effectiveSchema.parse({
      body: sanitizedBody,
      params: sanitizedParams,
      query: sanitizedQuery,
      headers: req.headers,
    });

    req.body = parsed.body;
    req.params = parsed.params;
    req.query = parsed.query;
    return next();
  } catch (error) {
    const statusCode = error instanceof InputValidationError ? Number(error.statusCode || 400) : 400;
    return res.status(statusCode).json({
      success: false,
      error: 'validation error',
      details:
        error instanceof InputValidationError
          ? formatInputValidationError(error)
          : formatValidationError(error),
    });
  }
};

module.exports = {
  validateRequest,
};
