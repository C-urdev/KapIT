const express = require('express');
const { verifyToken, requireCsrfForCookieAuth, optionalAuth } = require('../middleware/auth');
const {
  uploadResume,
  optimizeResume,
  getResumeJob,
  getResume,
  patchResume,
  deleteResume,
  streamSignedResumeFile,
  streamResumeJobEvents,
} = require('../controllers/resumeController');

const router = express.Router();
const resumeUploadParser = express.raw({
  type: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],
  limit: process.env.RESUME_UPLOAD_MAX_BYTES || '10mb',
});

router.post('/resumes/upload', verifyToken, requireCsrfForCookieAuth, resumeUploadParser, uploadResume);
router.post('/resumes/:id/optimize', verifyToken, requireCsrfForCookieAuth, optimizeResume);
router.get('/resume-jobs/:jobId', verifyToken, getResumeJob);
router.get('/resume-jobs/:jobId/stream', verifyToken, streamResumeJobEvents);
router.get('/resumes/:resumeId', optionalAuth, getResume);
router.patch('/resumes/:resumeId', verifyToken, requireCsrfForCookieAuth, express.json({ limit: '128kb' }), patchResume);
router.delete('/resumes/:resumeId', verifyToken, requireCsrfForCookieAuth, deleteResume);
router.get('/resumes/:resumeId/file/:fileKind', optionalAuth, streamSignedResumeFile);

module.exports = router;
