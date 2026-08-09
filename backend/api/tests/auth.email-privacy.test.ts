const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');

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

const createPrivacyPoolMock = () => {
  const users = {
    'viewer-1': {
      id: 'viewer-1',
      username: 'viewer',
      email: 'viewer@example.com',
      user_type: 'employee',
      is_premium: false,
      created_at: new Date().toISOString(),
      profile_completed: true,
      bio: '',
      socials: '',
      profile_image: '',
      address: '',
      education: '',
      desired_job: '',
      company_name: '',
      industry: '',
      company_size: '',
      website: '',
      hiring_for: '',
    },
    'target-1': {
      id: 'target-1',
      username: 'target',
      email: 'target@example.com',
      user_type: 'employee',
      is_premium: false,
      created_at: new Date().toISOString(),
      profile_completed: true,
      bio: '',
      socials: '',
      profile_image: '',
      address: '',
      education: '',
      desired_job: '',
      company_name: '',
      industry: '',
      company_size: '',
      website: '',
      hiring_for: '',
    },
  };

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized.startsWith('SELECT u.id, u.username, u.email, u.user_type,')) {
        const user = users[String(params[0])];
        return {
          rows: user
            ? [{
                ...user,
                full_name: user.username,
                preferred_it_role: user.desired_job,
                preferred_it_roles: [],
              }]
            : [],
        };
      }

      if (normalized.startsWith('SELECT id, username, email, company_name FROM users WHERE id = $1 LIMIT 1')) {
        const user = users[String(params[0])];
        return { rows: user ? [user] : [] };
      }

      if (normalized.startsWith('SELECT id, username, email, name, user_type, company_name, is_premium, profile_completed, profile_image FROM users')) {
        return {
          rows: [
            {
              id: 'target-1',
              username: 'target',
              email: 'target@example.com',
              name: 'Target User',
              user_type: 'employee',
              company_name: '',
              is_premium: false,
              profile_completed: true,
              profile_image: '',
            },
          ],
        };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async (...args: any[]) => client.query(args[0], args[1] ?? []),
  };
};

const createAppWithPrivacyMocks = () => {
  clearServerModuleCache();
  mockServerModule('config/database.ts', createPrivacyPoolMock());
  mockServerModule('config/runtimeSchema.ts', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
    ensureResumeSchemaReady: async () => {},
  });
  mockServerModule('controllers/notificationsController.js', {
    listNotifications: async (_req, res) => res.json({ success: true, notifications: [] }),
    getUnreadNotificationCount: async (_req, res) => res.json({ success: true, unreadCount: 0 }),
    markNotificationsRead: async (_req, res) => res.json({ success: true, marked: true }),
    createNotification: async () => {},
    ensureNotificationsTable: async () => {},
  });

  return require('../app').createApp();
};

const createAccessToken = (id, role = 'employee', accountType = 'developer') =>
  jwt.sign(
    {
      id,
      email: `${id}@example.com`,
      username: id,
      userType: role === 'company' ? 'company' : 'employee',
      role,
      accountType,
    },
    process.env.JWT_SECRET,
    { expiresIn: '20m' }
  );

test('GET /api/auth/search hides user email from normal users', async () => {
  const app = createAppWithPrivacyMocks();
  const token = createAccessToken('viewer-1', 'employee', 'developer');

  const response = await request(app)
    .get('/api/auth/search?q=target')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.results));
  assert.equal(response.body.results[0].email, '');
});

test('GET /api/auth/profile/:id hides other user email from normal users', async () => {
  const app = createAppWithPrivacyMocks();
  const token = createAccessToken('viewer-1', 'employee', 'developer');

  const response = await request(app)
    .get('/api/auth/profile/target-1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.profile.id, 'target-1');
  assert.equal(response.body.profile.email, '');
});

test('GET /api/auth/profile/:id keeps email visible for self access', async () => {
  const app = createAppWithPrivacyMocks();
  const token = createAccessToken('viewer-1', 'employee', 'developer');

  const response = await request(app)
    .get('/api/auth/profile/viewer-1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.profile.id, 'viewer-1');
  assert.equal(response.body.profile.email, 'viewer@example.com');
});
