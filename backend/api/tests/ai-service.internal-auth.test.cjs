const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { ensureBaseTestEnv, getTestEnvValue } = require('./testEnv.cjs');

const aiServiceModulePath = require.resolve('../services/aiService');

const loadAiService = () => {
  delete require.cache[aiServiceModulePath];
  return require('../services/aiService');
};

const withEnv = async (overrides, run) => {
  const keys = [
    'FASTAPI_URL',
    'FASTAPI_INTERNAL_SERVICE_TOKEN',
    'INTERNAL_SERVICE_TOKEN',
  ];
  const snapshot = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    delete require.cache[aiServiceModulePath];
  }
};

test('aiService sends internal auth via Bearer and internal header', async () => {
  ensureBaseTestEnv();
  const originalFetch = global.fetch;
  const capturedHeaders = [];

  global.fetch = async (url, options = {}) => {
    capturedHeaders.push(options.headers || {});
    return {
      ok: true,
      status: 200,
      json: async () => ({ reply: 'hello', intent: 'greeting', confidence: 1, actions: [] }),
    };
  };

  try {
    await withEnv(
      {
        FASTAPI_URL: getTestEnvValue('FASTAPI_URL', 'http://127.0.0.1:8000'),
        FASTAPI_INTERNAL_SERVICE_TOKEN: 'unit-fastapi-token-abcdefghijklmnopqrstuvwxyz',
      },
      async () => {
        const aiService = loadAiService();
        const response = await aiService.getChatbotReply({ message: 'hello' });
        assert.equal(response.reply, 'hello');
      }
    );

    assert.equal(capturedHeaders.length, 1);
    assert.equal(
      capturedHeaders[0].Authorization,
      'Bearer unit-fastapi-token-abcdefghijklmnopqrstuvwxyz'
    );
    assert.equal(
      capturedHeaders[0]['X-Internal-Service-Token'],
      'unit-fastapi-token-abcdefghijklmnopqrstuvwxyz'
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('aiService rejects missing internal token when FastAPI URL is configured', async () => {
  ensureBaseTestEnv();
  await withEnv(
    {
      FASTAPI_URL: 'http://127.0.0.1:8000',
      FASTAPI_INTERNAL_SERVICE_TOKEN: null,
      INTERNAL_SERVICE_TOKEN: null,
    },
    async () => {
      const aiService = loadAiService();
      await assert.rejects(
        () => aiService.getChatbotReply({ message: 'hello' }),
        (error) => error?.code === 'FASTAPI_AUTH_NOT_CONFIGURED'
      );
    }
  );
});

test('aiService surfaces unauthorized responses from FastAPI', async () => {
  ensureBaseTestEnv();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Unauthorized AI service request.' }),
  });

  try {
    await withEnv(
      {
        FASTAPI_URL: 'http://127.0.0.1:8000',
        FASTAPI_INTERNAL_SERVICE_TOKEN: 'unit-fastapi-token-abcdefghijklmnopqrstuvwxyz',
      },
      async () => {
        const aiService = loadAiService();
        await assert.rejects(
          () => aiService.getChatbotReply({ message: 'hello' }),
          (error) =>
            error?.statusCode === 401 &&
            /Unauthorized AI service request/i.test(String(error?.message || ''))
        );
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/public/chatbot/message returns chatbot response on valid internal token flow', async () => {
  ensureBaseTestEnv();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ reply: 'Hi there!', intent: 'greeting', confidence: 0.95, actions: [] }),
  });

  try {
    await withEnv(
      {
        FASTAPI_URL: 'http://127.0.0.1:8000',
        FASTAPI_INTERNAL_SERVICE_TOKEN: 'unit-fastapi-token-abcdefghijklmnopqrstuvwxyz',
      },
      async () => {
        const { createApp } = require('../app');
        const app = createApp();
        const response = await request(app)
          .post('/api/public/chatbot/message')
          .send({ message: 'hello' });

        assert.equal(response.status, 200);
        assert.equal(response.body.success, true);
        assert.equal(response.body.reply, 'Hi there!');
        assert.equal(response.body.intent, 'greeting');
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/public/chatbot/message returns degraded fallback when upstream AI rejects the request', async () => {
  ensureBaseTestEnv();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Unauthorized AI service request.' }),
  });

  try {
    await withEnv(
      {
        FASTAPI_URL: 'http://127.0.0.1:8000',
        FASTAPI_INTERNAL_SERVICE_TOKEN: 'unit-fastapi-token-abcdefghijklmnopqrstuvwxyz',
      },
      async () => {
        const { createApp } = require('../app');
        const app = createApp();
        const response = await request(app)
          .post('/api/public/chatbot/message')
          .send({ message: 'hello' });

        assert.equal(response.status, 200);
        assert.equal(response.body.success, true);
        assert.equal(response.body.degraded, true);
        assert.equal(response.body.intent, 'fallback');
        assert.equal(response.body.confidence, 0);
        assert.equal(response.headers['x-chatbot-degraded'], '1');
        assert.match(String(response.body.reply || ''), /something went wrong/i);
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
