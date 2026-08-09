const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { ensureBaseTestEnv, getTestEnvValue } = require('./testEnv.ts');

const serverRoot = path.resolve(__dirname, '..');
const originalEnv = { ...process.env };
const originalFetch = global.fetch;
const TEST_IP = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;

const clearServerModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(serverRoot)) {
      delete require.cache[key];
    }
  });
};

const mockServerModule = (relativePath, exportsValue) => {
  const modulePath = require.resolve(path.join(serverRoot, relativePath));
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  } as unknown as NodeJS.Module;
};

const createDatabaseMock = (options: any = {}) => {
  const existingUserByEmail = options.existingUserByEmail || null;

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT * FROM users WHERE')) {
        if (normalized.includes('LOWER(email) = $1')) {
          const requestedEmail = String(params[0] || '').trim().toLowerCase();
          const existingEmail = String(existingUserByEmail?.email || '').trim().toLowerCase();
          if (existingUserByEmail && requestedEmail && requestedEmail === existingEmail) {
            return { rows: [existingUserByEmail] };
          }
        }
        return { rows: [] };
      }
      return { rows: [] };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
  };
};

const loadApp = (options = {}) => {
  clearServerModuleCache();
  mockServerModule('config/database.js', createDatabaseMock(options));
  mockServerModule('config/runtimeSchema.js', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });
  return require('../app').createApp();
};

const createLocalAgent = (app) => request.agent(app);
const postLocal = (agent, path) => agent.post(path).set('host', 'localhost:5001').set('x-forwarded-for', TEST_IP);
const getLocal = (agent, path) => agent.get(path).set('host', 'localhost:5001').set('x-forwarded-for', TEST_IP);
const jsonResponse = (payload: any) => ({ json: async () => payload } as any);

const getMockGithubEmailForCode = (code) => {
  const normalizedCode = String(code || '').trim();
  const slug = normalizedCode.replace(/^local-bypass-github-/, '');
  if (slug === 'mismatch') {
    return 'mismatch@example.com';
  }
  return `${slug || 'unknown'}@example.com`;
};

const createGithubFetchMock = () => async (url, options: any = {}) => {
  const target = String(url || '');

  if (target === 'https://github.com/login/oauth/access_token') {
    const rawBody = String(options.body || '{}');
    const body = JSON.parse(rawBody);
    return jsonResponse({ access_token: `mock-token-${body.code || 'unknown'}` });
  }

  if (target === 'https://api.github.com/user') {
    const token = String(options.headers?.Authorization || '').replace(/^Bearer\s+/i, '');
    const code = token.replace(/^mock-token-/, '');
    return jsonResponse({
      id: `mock-gh-id-${code || 'unknown'}`,
      login: `mock-gh-${code || 'user'}`,
      name: 'Mock GitHub User',
    });
  }

  if (target === 'https://api.github.com/user/emails') {
    const token = String(options.headers?.Authorization || '').replace(/^Bearer\s+/i, '');
    const code = token.replace(/^mock-token-/, '');
    const email = getMockGithubEmailForCode(code);
    return jsonResponse([{ email, primary: true, verified: true }]);
  }

  throw new Error(`Unexpected fetch URL in oauth.security.test.ts: ${target}`);
};

const createOAuthState = async ({ agent, provider = 'github', mode = 'signup' }) => {
  const response = await postLocal(agent, '/api/auth/oauth/state').send({ provider, mode, accountTypeHint: 'company' });
  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.ok(response.body.state);
  return response.body.state;
};

test.beforeEach(() => {
  process.env = { ...originalEnv };
  ensureBaseTestEnv();
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_LOCAL_AUTH_BYPASS = 'true';
  process.env.OAUTH_STATE_TTL_MS = '1000';
  process.env.SOCIAL_SIGNUP_TTL_MS = '1000';
  getTestEnvValue('GITHUB_CLIENT_ID', 'mock-github-client-id');
  getTestEnvValue('GITHUB_CLIENT_SECRET', 'mock-github-client-secret');
  global.fetch = createGithubFetchMock() as any;
});

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
  clearServerModuleCache();
});

test('OAuth callback with missing state fails safely', async () => {
  const app = loadApp();
  const response = await createLocalAgent(app)
    .post('/api/auth/github')
    .set('host', 'localhost:5001')
    .send({ code: 'local-bypass-github-safecheck' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('OAuth callback with invalid state fails safely', async () => {
  const app = loadApp();
  const response = await createLocalAgent(app)
    .post('/api/auth/github')
    .set('host', 'localhost:5001')
    .send({ code: 'local-bypass-github-safecheck', state: 'invalid-state-value' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Unable to verify sign-in request. Please try again.');
});

test('OAuth state cannot be reused and social signup does not expose query token', async () => {
  const app = loadApp();
  const agent = createLocalAgent(app);
  const state = await createOAuthState({ agent });

  const first = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-reuse', state });

  assert.equal(first.status, 404);
  assert.equal(first.body.success, false);
  assert.equal(first.body.error, 'No account is registered for this social login yet.');
  assert.equal(Object.prototype.hasOwnProperty.call(first.body, 'socialSignupToken'), false);

  const second = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-reuse', state });

  assert.equal(second.status, 400);
  assert.equal(second.body.success, false);
  assert.equal(second.body.error, 'Unable to verify sign-in request. Please try again.');
});

test('OAuth state and social signup session expire quickly when expired', async () => {
  const app = loadApp();
  const agent = createLocalAgent(app);
  const state = await createOAuthState({ agent });

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const expiredState = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-expired', state });

  assert.equal(expiredState.status, 400);
  assert.equal(expiredState.body.success, false);
  assert.equal(expiredState.body.error, 'Unable to verify sign-in request. Please try again.');

  const freshState = await createOAuthState({ agent });
  const sessionCreation = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-session', state: freshState });
  assert.equal(sessionCreation.status, 404);

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const expiredSession = await getLocal(agent, '/api/auth/social-signup/session');
  assert.equal(expiredSession.status, 404);
  assert.equal(expiredSession.body.success, false);
  assert.equal(expiredSession.body.error, 'Social signup session is missing or expired. Please start again.');
});

test('Auth route responses send no-store and noindex headers', async () => {
  const app = loadApp();
  const response = await createLocalAgent(app)
    .post('/api/auth/login')
    .set('host', 'localhost:5001')
    .send({});

  assert.equal(response.headers['cache-control'], 'no-store, max-age=0');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['x-robots-tag'], 'noindex, nofollow');
});

test('OAuth signup blocks account-type mismatch for existing email accounts', async () => {
  const app = loadApp({
    existingUserByEmail: {
      id: 'existing-user-id',
      email: 'mismatch@example.com',
      username: 'existing-user',
      user_type: 'employee',
      account_type: 'developer',
      profile_completed: false,
    },
  });
  const agent = createLocalAgent(app);
  const state = await createOAuthState({ agent, provider: 'github', mode: 'signup' });

  const response = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-mismatch', state });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, 'SOCIAL_SIGNUP_ACCOUNT_TYPE_MISMATCH');
});

test('OAuth login blocks account-type mismatch before issuing a session', async () => {
  const app = loadApp({
    existingUserByEmail: {
      id: 'existing-user-id',
      email: 'mismatch@example.com',
      username: 'existing-user',
      user_type: 'employee',
      account_type: 'developer',
      profile_completed: false,
    },
  });
  const agent = createLocalAgent(app);
  const state = await createOAuthState({ agent, provider: 'github', mode: 'login' });

  const response = await postLocal(agent, '/api/auth/github')
    .send({ code: 'local-bypass-github-mismatch', state });

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.equal(response.body.code, 'SOCIAL_LOGIN_ACCOUNT_TYPE_MISMATCH');
});
