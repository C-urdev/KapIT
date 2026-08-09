const express = require('express');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { presignRateLimiter } = require('../middleware/security');
const { requestPresignedUrl, confirmUpload } = require('../controllers/uploadController');
const { logger } = require('../config/logger');

const buildProfileImagePrefix = (userId) => `uploads/${userId}/profile_images/`;

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

// Resolve an R2 object key into a short-lived presigned download URL.
// Used by the frontend to display profile images stored in R2.
router.post(
  '/uploads/resolve-image',
  verifyToken,
  express.json({ limit: '8kb' }),
  async (req, res) => {
    try {
      const { isR2Enabled } = require('../config/r2');
      if (!isR2Enabled()) {
        return res.status(503).json({ success: false, error: 'Cloud storage is not configured.' });
      }

      const objectKey = String(req.body?.objectKey || '').trim();
      if (!objectKey || !objectKey.startsWith(buildProfileImagePrefix(req.user.id))) {
        return res.status(400).json({ success: false, error: 'Invalid object key.' });
      }

      const { generatePresignedDownloadUrl } = require('../services/r2UploadService');
      const url = await generatePresignedDownloadUrl({ objectKey, expiresSeconds: 3600 });

      return res.json({ success: true, url });
    } catch (error) {
      logger.error({ error: error?.message }, 'upload.resolve-image.failed');
      return res.status(500).json({ success: false, error: 'Failed to resolve image URL.' });
    }
  }
);

module.exports = router;
