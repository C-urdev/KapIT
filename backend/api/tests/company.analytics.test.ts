const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();
require.extensions['.ts'] = require.extensions['.js'];

const serverRoot = path.resolve(__dirname, '..');

const clearServerModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(serverRoot)) {
      delete require.cache[key];
    }
  });
};

const mockServerModule = (relativePath, exportsValue) => {
  const basePath = path.join(serverRoot, relativePath);
  let modulePath = '';
  try {
    modulePath = require.resolve(basePath);
  } catch {
    modulePath = require.resolve(basePath.replace(/\.js$/, '.ts'));
  }

  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  };
};

const createPoolMock = () => {
  const company = { id: 'company-analytics-1', user_id: 'company-user-analytics', name: 'KapIT Employer' };
  let rangeCountCalls = 0;

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized === 'SELECT COUNT(*)::int AS count FROM jobs WHERE company_id = $1') {
        return { rows: [{ count: 5 }], rowCount: 1 };
      }
      if (normalized.includes('FROM jobs WHERE company_id = $1 GROUP BY status')) {
        return {
          rows: [
            { status: 'open', count: 2 },
            { status: 'draft', count: 1 },
            { status: 'filled', count: 1 },
            { status: 'closed', count: 1 },
          ],
          rowCount: 4,
        };
      }
      if (normalized.includes('SELECT COUNT(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1') && !normalized.includes('a.created_at >=')) {
        return { rows: [{ count: 12 }], rowCount: 1 };
      }
      if (normalized.includes('SELECT a.status, COUNT(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1 GROUP BY a.status')) {
        return {
          rows: [
            { status: 'pending', count: 4 },
            { status: 'reviewed', count: 3 },
            { status: 'accepted', count: 2 },
            { status: 'rejected', count: 3 },
          ],
          rowCount: 4,
        };
      }
      if (normalized.includes('SELECT COUNT(*)::int AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1 AND a.created_at >= $2 AND a.created_at <= $3')) {
        rangeCountCalls += 1;
        return rangeCountCalls === 1
          ? { rows: [{ count: 5 }], rowCount: 1 }
          : { rows: [{ count: 3 }], rowCount: 1 };
      }
      if (normalized.includes('WITH series AS')) {
        return {
          rows: [
            { day: '2026-07-20', count: 1 },
            { day: '2026-07-21', count: 0 },
            { day: '2026-07-22', count: 2 },
            { day: '2026-07-23', count: 0 },
            { day: '2026-07-24', count: 1 },
            { day: '2026-07-25', count: 0 },
            { day: '2026-07-26', count: 1 },
          ],
          rowCount: 7,
        };
      }
      if (normalized.includes('SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, hired_at) - created_at)) / 86400.0) AS avg_days_open FROM jobs')) {
        return { rows: [{ avg_days_open: 18.4 }], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [], rowCount: 0 }),
    __company: company,
  };
};

const loadController = () => {
  clearServerModuleCache();
  const poolMock = createPoolMock();

  mockServerModule('config/database.js', poolMock);
  mockServerModule('config/logger.js', { logger: { error: () => {}, info: () => {}, warn: () => {} } });
  mockServerModule('controllers/notificationsController.js', { createNotification: async () => {}, ensureNotificationsTable: async () => {} });
  mockServerModule('config/runtimeSchema.js', {
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });
  mockServerModule('services/companyService.js', {
    getOrCreateCompanyForUserId: async () => poolMock.__company,
    normalizeSkills: (skills) => skills,
    normalizeRelatedCompanies: (items) => items,
    serializeJobRow: (row) => row,
  });
  mockServerModule('services/jobService.js', { createDraftJobForCompany: async () => ({}) });
  mockServerModule('services/planAccessService.js', {
    assertCompanyCanCreateDraftJob: async () => ({ isPremium: false }),
    getPremiumStateForCompanyUser: async () => ({ isPremium: false }),
    requirePremiumEmployerFeature: () => {},
  });
  mockServerModule('services/jobAvailabilityService.js', {
    withJobAvailability: (job) => job,
    closeExpiredJobs: async () => {},
    normalizeDeadlineInput: (value) => value,
  });
  mockServerModule('services/aiService.js', {
    isAiConfigured: () => false,
    rankCandidatesForJob: async () => [],
  });
  mockServerModule('services/emailService.js', { sendApplicationStatusEmail: async () => {} });
  mockServerModule('utils/socials.js', { normalizeSocialsText: (value) => value || '' });

  return require('../controllers/companyController.ts');
};

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
};

test('company analytics returns real summary metrics, time series, and range metadata', async () => {
  const { getAnalytics } = loadController();
  const res = createResponse();

  await getAnalytics(
    {
      user: { id: 'company-user-analytics' },
      query: { start: '2026-07-20', end: '2026-07-26' },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.analytics.totalJobs, 5);
  assert.equal(res.body.analytics.openJobs, 2);
  assert.equal(res.body.analytics.draftJobs, 1);
  assert.equal(res.body.analytics.filledJobs, 1);
  assert.equal(res.body.analytics.closedJobs, 1);
  assert.equal(res.body.analytics.totalApplicants, 12);
  assert.equal(res.body.analytics.newApplicantsInRange, 5);
  assert.equal(res.body.analytics.previousPeriod.newApplicantsInRange, 3);
  assert.equal(res.body.analytics.applicantsAwaitingReview, 4);
  assert.equal(res.body.analytics.averageApplicantsPerOpenJob, 6);
  assert.equal(res.body.analytics.averageDaysOpen, 18.4);
  assert.equal(res.body.analytics.jobsByStatus.open, 2);
  assert.equal(res.body.analytics.applicantsByStatus.reviewed, 3);
  assert.equal(Array.isArray(res.body.analytics.applicationsOverTime), true);
  assert.equal(res.body.analytics.applicationsOverTime.length, 7);
  assert.equal(res.body.analytics.range.days, 7);
  assert.equal(res.body.analytics.range.mode, 'custom');
});
