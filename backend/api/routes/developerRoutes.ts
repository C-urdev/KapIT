const express = require('express');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { resumeOptimizeRateLimiter } = require('../middleware/security');
const {
  getMyDeveloperProfile,
  upsertMyDeveloperProfile,
  uploadMyResume,
  downloadResume,
  analyzeMyResume,
  optimizeMyResume,
  useOptimizedResumeAsPrimary,
} = require('../controllers/developerController');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');

const router = express.Router();
const resumeUploadParser = express.raw({
  type: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],
  limit: process.env.RESUME_UPLOAD_MAX_BYTES || '5mb',
});

const requireDeveloperAccount = (req, res, next) => {
  if (req.user?.userType !== 'employee' && req.user?.accountType !== 'developer') {
    return res.status(403).json({ success: false, message: 'Developer account required' });
  }
  return next();
};

router.get('/resumes/:storedName', verifyToken, downloadResume);

router.use(verifyToken, requireDeveloperAccount);

router.get('/profile', getMyDeveloperProfile);
router.put('/profile', requireCsrfForCookieAuth, validateRequest(writeSchemas.developerProfileUpdate), upsertMyDeveloperProfile);
router.post('/resume', requireCsrfForCookieAuth, validateRequest(writeSchemas.developerResumeUpload), resumeUploadParser, uploadMyResume);
router.post('/ai/resume-analysis', requireCsrfForCookieAuth, validateRequest(writeSchemas.developerResumeAnalysis), analyzeMyResume);
router.post('/ai/resume-optimize', requireCsrfForCookieAuth, resumeOptimizeRateLimiter, validateRequest(writeSchemas.developerResumeAnalysis), optimizeMyResume);
router.post('/ai/resume-use-optimized', requireCsrfForCookieAuth, useOptimizedResumeAsPrimary);

module.exports = router;
