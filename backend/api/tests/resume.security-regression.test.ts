const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const express = require('express');
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
  } as NodeJS.Module;
};

test('runAtsOptimizationJob keeps generated ATS resumes private and avoids long DB transactions', async () => {
  clearServerModuleCache();
  const events = [];
  let insertSql = '';

  const poolMock = {
    query: async (sql) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();
      events.push(normalized);
      if (normalized.startsWith('SELECT * FROM resumes')) {
        return {
          rows: [{
            id: 'resume-1',
            user_id: 'user-1',
            storage_provider: 'local',
            extracted_text: 'existing resume text',
            original_filename: 'resume.pdf',
            pdf_url: '/api/developer/resumes/source.pdf',
            docx_url: null,
          }],
        };
      }
      if (normalized.startsWith('SELECT COALESCE(preferred_it_role')) {
        return { rows: [{ preferred_role: 'Backend Engineer' }] };
      }
      return { rows: [] };
    },
    connect: async () => ({
      query: async (sql) => {
        const normalized = String(sql).replace(/\s+/g, ' ').trim();
        events.push(normalized);
        if (normalized.startsWith('INSERT INTO resumes')) {
          insertSql = normalized;
          return { rows: [{ id: 'ats-1' }] };
        }
        return { rows: [] };
      },
      release: () => {},
    }),
  };

  mockServerModule('config/database.ts', poolMock);
  mockServerModule('services/resumeOptimizationService.ts', {
    parseResumeText: async () => 'parsed resume text',
    callGeminiForResume: async () => {
      events.push('gemini');
      return { atsScore: 88 };
    },
    buildDocxBuffer: async () => Buffer.from('docx'),
    buildGeneratedFileName: (_prefix, ext) => `ats-resume${ext}`,
  });
  mockServerModule('services/resumeStorageService.ts', {
    storeGeneratedResumeArtifact: async () => ({ absolutePath: 'Z:\\tmp\\ats.docx', url: '/api/developer/resumes/ats.docx' }),
    storeResumeUpload: async () => ({}),
    getStoredNameFromResumeUrl: () => 'source.pdf',
    getStoredResumePath: () => 'Z:\\tmp\\source.pdf',
  });
  mockServerModule('services/pdfConversionService.ts', {
    convertDocxToPdf: async () => ({ ok: false, reason: 'not installed' }),
  });
  mockServerModule('services/antivirusService.ts', {
    scanFile: async () => ({ clean: true }),
    quarantineFile: async () => {},
  });
  mockServerModule('services/resumeJobEvents.ts', {
    emitResumeJobEvent: () => {},
  });

  const { runAtsOptimizationJob } = require('../services/resumeService');
  const result = await runAtsOptimizationJob({ userId: 'user-1', sourceResumeId: 'resume-1', jobId: 'job-1' });

  assert.equal(result, 'ats-1');
  assert.match(insertSql, /TRUE,FALSE,'private','completed'/);
  assert.ok(events.indexOf('gemini') < events.indexOf('BEGIN'));
});

test('/api/uploads/resolve-image rejects authenticated access to resume object keys', async () => {
  clearServerModuleCache();
  let signedObjectKey = '';

  mockServerModule('middleware/auth.ts', {
    verifyToken: (req, _res, next) => {
      req.user = { id: 'user-1' };
      next();
    },
    requireCsrfForCookieAuth: (_req, _res, next) => next(),
  });
  mockServerModule('config/r2.ts', {
    isR2Enabled: () => true,
  });
  mockServerModule('services/r2UploadService.ts', {
    generatePresignedDownloadUrl: async ({ objectKey }) => {
      signedObjectKey = objectKey;
      return 'https://r2.example/download';
    },
  });
  mockServerModule('controllers/uploadController.ts', {
    requestPresignedUrl: (_req, res) => res.json({ success: true }),
    confirmUpload: (_req, res) => res.json({ success: true }),
  });

  const app = express();
  app.use('/api', require('../routes/uploadRoutes'));

  const forbidden = await request(app)
    .post('/api/uploads/resolve-image')
    .send({ objectKey: 'uploads/user-1/resumes/private.pdf' });

  assert.equal(forbidden.status, 400);
  assert.equal(signedObjectKey, '');

  const allowed = await request(app)
    .post('/api/uploads/resolve-image')
    .send({ objectKey: 'uploads/user-1/profile_images/avatar.png' });

  assert.equal(allowed.status, 200);
  assert.equal(signedObjectKey, 'uploads/user-1/profile_images/avatar.png');
});

test('listUserVisibleResume limits applications_only resumes to the owning application company', async () => {
  clearServerModuleCache();
  let canCompanyAccess = false;

  mockServerModule('config/database.ts', {
    query: async (_sql, values) => {
      assert.equal(values[0], 'resume-1');
      return {
        rows: [{
          id: 'resume-1',
          user_id: 'developer-1',
          is_public: false,
          visibility_scope: 'applications_only',
          requester_company_has_application: canCompanyAccess,
        }],
      };
    },
  });

  const { listUserVisibleResume } = require('../services/resumeService');

  const unrelatedCompanyResult = await listUserVisibleResume({
    resumeId: 'resume-1',
    requester: { id: 'company-user-2', accountType: 'company', userType: 'company' },
  });
  assert.deepEqual(unrelatedCompanyResult, { forbidden: true });

  canCompanyAccess = true;
  const owningCompanyResult = await listUserVisibleResume({
    resumeId: 'resume-1',
    requester: { id: 'company-user-1', accountType: 'company', userType: 'company' },
  });
  assert.equal(owningCompanyResult.id, 'resume-1');
});
