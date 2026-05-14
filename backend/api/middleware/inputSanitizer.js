const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

class InputValidationError extends Error {
  constructor(message, { path = '', statusCode = 400, code = 'invalid_input' } = {}) {
    super(message);
    this.name = 'InputValidationError';
    this.path = path;
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const buildLimits = (overrides = {}) => ({
  maxDepth: toPositiveInteger(overrides.maxDepth, 12),
  maxObjectKeys: toPositiveInteger(overrides.maxObjectKeys, 120),
  maxTotalKeys: toPositiveInteger(overrides.maxTotalKeys, 800),
  maxArrayLength: toPositiveInteger(overrides.maxArrayLength, 200),
  maxStringLength: toPositiveInteger(overrides.maxStringLength, 8000),
  maxKeyLength: toPositiveInteger(overrides.maxKeyLength, 120),
  maxNodes: toPositiveInteger(overrides.maxNodes, 3000),
});

const sanitizeAndValidateInput = (value, overrides = {}) => {
  const limits = buildLimits(overrides);
  const state = {
    keyCount: 0,
    nodeCount: 0,
  };

  const visit = (current, path, depth) => {
    state.nodeCount += 1;
    if (state.nodeCount > limits.maxNodes) {
      throw new InputValidationError('Payload is too complex.', {
        path,
        statusCode: 413,
        code: 'payload_too_large',
      });
    }

    if (current === undefined || current === null) {
      return current;
    }

    const currentType = typeof current;
    if (currentType === 'string') {
      const normalized = current.normalize('NFKC').replace(/\u0000/g, '');
      if (normalized.length > limits.maxStringLength) {
        throw new InputValidationError('Input string exceeds allowed length.', {
          path,
          statusCode: 413,
          code: 'payload_too_large',
        });
      }
      return normalized;
    }

    if (currentType === 'number') {
      if (!Number.isFinite(current)) {
        throw new InputValidationError('Invalid numeric value.', {
          path,
          code: 'invalid_number',
        });
      }
      return current;
    }

    if (currentType === 'boolean') {
      return current;
    }

    if (Array.isArray(current)) {
      if (depth >= limits.maxDepth) {
        throw new InputValidationError('Payload nesting is too deep.', {
          path,
          code: 'invalid_structure',
        });
      }
      if (current.length > limits.maxArrayLength) {
        throw new InputValidationError('Array exceeds allowed length.', {
          path,
          statusCode: 413,
          code: 'payload_too_large',
        });
      }

      return current.map((item, index) =>
        visit(item, path ? `${path}[${index}]` : `[${index}]`, depth + 1)
      );
    }

    if (currentType === 'object') {
      if (depth >= limits.maxDepth) {
        throw new InputValidationError('Payload nesting is too deep.', {
          path,
          code: 'invalid_structure',
        });
      }

      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new InputValidationError('Malformed object payload.', {
          path,
          code: 'invalid_structure',
        });
      }

      const entries = Object.entries(current);
      if (entries.length > limits.maxObjectKeys) {
        throw new InputValidationError('Object contains too many fields.', {
          path,
          statusCode: 413,
          code: 'payload_too_large',
        });
      }

      const sanitized = {};
      for (const [rawKey, rawValue] of entries) {
        const key = String(rawKey);
        if (!key) {
          throw new InputValidationError('Object key cannot be empty.', {
            path,
            code: 'invalid_structure',
          });
        }
        if (key.length > limits.maxKeyLength) {
          throw new InputValidationError('Object key exceeds allowed length.', {
            path: path ? `${path}.${key}` : key,
            statusCode: 413,
            code: 'payload_too_large',
          });
        }
        if (DANGEROUS_KEYS.has(key)) {
          throw new InputValidationError(`Disallowed key "${key}" in request payload.`, {
            path: path ? `${path}.${key}` : key,
            code: 'invalid_structure',
          });
        }

        state.keyCount += 1;
        if (state.keyCount > limits.maxTotalKeys) {
          throw new InputValidationError('Payload contains too many fields.', {
            path: path ? `${path}.${key}` : key,
            statusCode: 413,
            code: 'payload_too_large',
          });
        }

        const nextPath = path ? `${path}.${key}` : key;
        sanitized[key] = visit(rawValue, nextPath, depth + 1);
      }

      return sanitized;
    }

    throw new InputValidationError('Unsupported input value type.', {
      path,
      code: 'invalid_type',
    });
  };

  return visit(value, '', 0);
};

module.exports = {
  InputValidationError,
  sanitizeAndValidateInput,
};
