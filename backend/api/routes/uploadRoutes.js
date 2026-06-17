const express = require('express');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { presignRateLimiter } = require('../middleware/security');
const { requestPresignedUrl, confirmUpload } = require('../controllers/uploadController');

const router = express.Router();

// Two-phase upload flow:
// 1. Client requests a presigned URL (validates metadata, returns scoped PUT URL)
// 2. Client uploads directly to R2 using the presigned URL
// 3. Client confirms the upload (backend verifies the object, runs AV, creates DB record)
router.post(
  '/uploads/presign',
  verifyToken,
  requireCsrfForCookieAuth,
  presignRateLimiter,
  express.json({ limit: '16kb' }),
  requestPresignedUrl
);

router.post(
  '/uploads/confirm',
  verifyToken,
  requireCsrfForCookieAuth,
  express.json({ limit: '16kb' }),
  confirmUpload
);

module.exports = router;
