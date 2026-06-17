const path = require('path');
const { logger } = require('../config/logger');
const { isR2Enabled } = require('../config/r2');
const pool = require('../config/database');
const { generatePresignedUploadUrl, verifyUploadedObject } = require('../services/r2UploadService');
const { buildPresignSchema, buildConfirmSchema } = require('../validation/uploadSchemas');
const { parseResumeText } = require('../services/resumeOptimizationService');

const RESUME_URL_PREFIX = '/api/developer/resumes/';

/**
 * POST /api/uploads/presign
 *
 * Validates the declared file metadata (name, type, size) and returns a
 * time-limited presigned PUT URL for direct upload to R2.
 *
 * The R2 credentials never reach the client. Only the scoped URL is returned.
 */
const requestPresignedUrl = async (req, res) => {
  try {
    if (!isR2Enabled()) {
      return res.status(503).json({
        success: false,
        error: 'Cloud storage is not configured.',
      });
    }

    const schema = buildPresignSchema();
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        success: false,
        error: firstIssue?.message || 'Invalid upload request.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { fileName, contentType, fileSize } = parsed.data;
    const result = await generatePresignedUploadUrl({
      userId: req.user.id,
      originalName: fileName,
      contentType,
      fileSize,
    });

    return res.status(200).json({
      success: true,
      uploadUrl: result.uploadUrl,
      objectKey: result.objectKey,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error({ error: error?.message, userId: req.user?.id }, 'upload.presign.failed');
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error?.message || 'Failed to generate upload URL.',
    });
  }
};

/**
 * POST /api/uploads/confirm
 *
 * Called after the client has successfully PUT the file to R2 using the
 * presigned URL. This endpoint:
 *   1. Verifies the caller owns the object key (path starts with uploads/<userId>/)
 *   2. HEAD + GET the object from R2 to verify size, type, and magic bytes
 *   3. Downloads to temp file for AV scan (Option B)
 *   4. Creates the resume database record
 */
const confirmUpload = async (req, res) => {
  try {
    if (!isR2Enabled()) {
      return res.status(503).json({
        success: false,
        error: 'Cloud storage is not configured.',
      });
    }

    const schema = buildConfirmSchema();
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        success: false,
        error: firstIssue?.message || 'Invalid confirmation request.',
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { objectKey, contentType, fileSize } = parsed.data;

    // Ownership check: the object key must be scoped to the authenticated user.
    const expectedPrefix = `uploads/${req.user.id}/`;
    if (!objectKey.startsWith(expectedPrefix)) {
      logger.warn(
        { userId: req.user.id, objectKey },
        'upload.confirm.ownership_violation'
      );
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to confirm this upload.',
      });
    }

    // Verify the object in R2 (HEAD, download, magic bytes, AV scan).
    const verified = await verifyUploadedObject({
      objectKey,
      expectedSize: fileSize,
      expectedContentType: contentType,
      req,
      userId: req.user.id,
    });

    // Extract text from the uploaded document.
    const ext = path.extname(objectKey).toLowerCase();
    let extractedText = '';
    try {
      // parseResumeText expects { absolutePath, fileName } but we have a buffer.
      // Write to a temp file for text extraction.
      const fs = require('fs/promises');
      const os = require('os');
      const crypto = require('crypto');
      const tempDir = path.join(os.tmpdir(), 'kapit-text-extract');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `${crypto.randomUUID()}${ext}`);
      await fs.writeFile(tempFile, verified.buffer);
      extractedText = await parseResumeText({
        absolutePath: tempFile,
        fileName: path.basename(objectKey),
      }).catch(() => '');
      await fs.unlink(tempFile).catch(() => {});
    } catch {
      extractedText = '';
    }

    // Derive original file name from the object key.
    const keyBasename = path.basename(objectKey);
    const originalName = keyBasename.replace(/^\d+-[0-9a-f-]+-/i, '') || 'resume' + ext;

    const pdfUrl = ext === '.pdf' ? `${RESUME_URL_PREFIX}r2:${encodeURIComponent(objectKey)}` : null;
    const docxUrl = ext === '.docx' ? `${RESUME_URL_PREFIX}r2:${encodeURIComponent(objectKey)}` : null;
    const docUrl = ext === '.doc' ? `${RESUME_URL_PREFIX}r2:${encodeURIComponent(objectKey)}` : null;

    // Insert into database.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE resumes SET is_primary = FALSE WHERE user_id = $1 AND resume_type = 'original' AND is_primary = TRUE`,
        [req.user.id]
      );

      const insert = await client.query(
        `INSERT INTO resumes (
          user_id, resume_type, original_filename, storage_provider,
          r2_object_key, pdf_url, docx_url, extracted_text,
          is_primary, is_public, visibility_scope, processing_status
        ) VALUES ($1, 'original', $2, 'r2', $3, $4, $5, $6, TRUE, FALSE, 'private', 'completed')
        RETURNING *`,
        [
          req.user.id,
          originalName,
          objectKey,
          pdfUrl || docUrl,
          docxUrl,
          extractedText,
        ]
      );

      // Update legacy profile pointers.
      const rows = await client.query(
        `SELECT id, resume_type, pdf_url, docx_url, ats_data_json
         FROM resumes
         WHERE user_id = $1 AND archived_at IS NULL
         ORDER BY is_primary DESC, created_at DESC`,
        [req.user.id]
      );
      const primaryOriginal = rows.rows.find((r) => r.resume_type === 'original');
      const primaryAts = rows.rows.find((r) => r.resume_type === 'ats_optimized');
      await client.query(
        `INSERT INTO developer_profiles (user_id, resume_url, optimized_resume_docx_url, optimized_resume_pdf_url, optimized_resume_json, updated_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           resume_url = EXCLUDED.resume_url,
           optimized_resume_docx_url = EXCLUDED.optimized_resume_docx_url,
           optimized_resume_pdf_url = EXCLUDED.optimized_resume_pdf_url,
           optimized_resume_json = EXCLUDED.optimized_resume_json,
           updated_at = CURRENT_TIMESTAMP`,
        [
          req.user.id,
          primaryOriginal?.pdf_url || primaryOriginal?.docx_url || null,
          primaryAts?.docx_url || null,
          primaryAts?.pdf_url || null,
          JSON.stringify(primaryAts?.ats_data_json || {}),
        ]
      );

      await client.query('COMMIT');

      logger.info(
        { userId: req.user.id, objectKey, resumeId: insert.rows[0].id },
        'upload.confirm.success'
      );

      return res.status(201).json({
        success: true,
        resume: insert.rows[0],
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error({ error: error?.message, userId: req.user?.id }, 'upload.confirm.failed');
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error?.message || 'Upload confirmation failed.',
    });
  }
};

module.exports = {
  requestPresignedUrl,
  confirmUpload,
};
