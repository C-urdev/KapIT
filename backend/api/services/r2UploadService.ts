const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getR2Client, getR2BucketName, getR2PresignExpireSeconds, getR2UploadMaxBytes } = require('../config/r2');
const { logger } = require('../config/logger');
const { logSecurityViolation } = require('../config/securityEventLogger');
const { scanFile, quarantineFile } = require('./antivirusService');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp']);

const MIME_TO_EXTENSION = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const PDF_SIGNATURE = Buffer.from('%PDF-');
const DOC_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
const DOCX_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

// Extremely basic magic bytes for images (PNG, JPEG, WEBP)
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
const JPEG_SIGNATURE = Buffer.from([0xFF, 0xD8, 0xFF]);
const WEBP_SIGNATURE = Buffer.from('WEBP');

// Size tolerance when verifying uploaded object (metadata overhead).
const SIZE_TOLERANCE_BYTES = 2048;

/**
 * Sanitize the original file name for use in the R2 object key.
 * Strips path separators, control characters, and non-ASCII characters.
 */
const sanitizeFileName = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return normalized || 'upload';
};

/**
 * Build an R2 object key scoped to the user.
 *
 * Format: uploads/<userId>/<timestamp>-<uuid>-<sanitized-name>.<ext>
 */
const buildObjectKey = ({ userId, originalName, contentType, intent }) => {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  const resolvedExt = ALLOWED_EXTENSIONS.has(ext) ? ext : (MIME_TO_EXTENSION[contentType] || '.pdf');
  const baseName = sanitizeFileName(
    String(originalName || 'upload').replace(/\.[^.]+$/, '')
  );
  const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;
  const subFolder = intent === 'profile_image' ? 'profile_images' : 'resumes';
  return `uploads/${userId}/${subFolder}/${uniqueId}-${baseName}${resolvedExt}`;
};

/**
 * Validate magic bytes of a buffer against the declared extension.
 * Returns an error message string if invalid, or null if valid.
 */
const validateMagicBytes = (buffer, extension) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return 'File is empty.';
  }

  if (extension === '.pdf') {
    if (buffer.length < PDF_SIGNATURE.length || !buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
      return 'File content does not match a valid PDF.';
    }
  } else if (extension === '.doc') {
    if (buffer.length < DOC_SIGNATURE.length || !buffer.subarray(0, DOC_SIGNATURE.length).equals(DOC_SIGNATURE)) {
      return 'File content does not match a valid DOC.';
    }
  } else if (extension === '.docx') {
    if (buffer.length < DOCX_SIGNATURE.length || !buffer.subarray(0, DOCX_SIGNATURE.length).equals(DOCX_SIGNATURE)) {
      return 'File content does not match a valid DOCX.';
    }
  } else if (extension === '.png') {
    if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return 'File content does not match a valid PNG.';
    }
  } else if (extension === '.jpg' || extension === '.jpeg') {
    if (buffer.length < JPEG_SIGNATURE.length || !buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
      return 'File content does not match a valid JPEG.';
    }
  } else if (extension === '.webp') {
    if (buffer.length < 12 || !buffer.subarray(8, 12).equals(WEBP_SIGNATURE)) {
      return 'File content does not match a valid WEBP.';
    }
  }

  return null;
};

/**
 * Generate a time-limited presigned PUT URL for uploading a file to R2.
 *
 * All validation (extension, MIME, size) is performed before the URL is created.
 * The presigned URL locks the Content-Type to prevent content-type smuggling.
 */
const generatePresignedUploadUrl = async ({ userId, originalName, contentType, fileSize, intent = 'resume' }) => {
  const maxBytes = getR2UploadMaxBytes();

  if (fileSize > maxBytes) {
    const error = new Error(`File size ${fileSize} exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB limit.`);
    (error as any).statusCode = 400;
    throw error;
  }

  const ext = path.extname(String(originalName || '')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const error = new Error('Unsupported file extension.');
    (error as any).statusCode = 400;
    throw error;
  }

  if (!MIME_TO_EXTENSION[contentType]) {
    const error = new Error('Unsupported content type.');
    (error as any).statusCode = 400;
    throw error;
  }

  const objectKey = buildObjectKey({ userId, originalName, contentType, intent });
  const expiresIn = getR2PresignExpireSeconds();

  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
    ContentType: contentType,
    // Store metadata for server-side verification on confirm.
    Metadata: {
      'x-kapit-user-id': String(userId),
      'x-kapit-declared-size': String(fileSize),
      'x-kapit-original-name': sanitizeFileName(originalName),
      'x-kapit-intent': String(intent),
    },
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  logger.info(
    { userId, objectKey, contentType, fileSize, expiresIn, intent },
    'r2.presigned_url.generated'
  );

  return { uploadUrl, objectKey, expiresAt };
};

/**
 * Download the uploaded object from R2, write to a temp file, run AV scan,
 * then validate magic bytes. If the file is infected or invalid, delete it
 * from R2 and throw.
 *
 * Returns the verified object metadata on success.
 */
const verifyUploadedObject = async ({ objectKey, expectedSize, expectedContentType, req, userId }) => {
  const client = getR2Client();
  const bucket = getR2BucketName();

  // 1. HEAD the object to confirm it exists and matches expectations.
  let headResult;
  try {
    headResult = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
    );
  } catch (headError) {
    if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
      const error = new Error('Upload not found. The presigned URL may have expired before the file was uploaded.');
      (error as any).statusCode = 404;
      throw error;
    }
    throw headError;
  }

  const actualSize = Number(headResult.ContentLength || 0);
  const maxBytes = getR2UploadMaxBytes();

  if (actualSize > maxBytes) {
    await deleteR2Object(objectKey);
    const error = new Error(`Uploaded file exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB limit.`);
    (error as any).statusCode = 413;
    throw error;
  }

  if (Math.abs(actualSize - expectedSize) > SIZE_TOLERANCE_BYTES) {
    logger.warn(
      { objectKey, actualSize, expectedSize },
      'r2.verify.size_mismatch'
    );
  }

  // 2. Download the object into a temp file for AV scanning + magic byte validation.
  const getResult = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  );

  const chunks = [];
  for await (const chunk of getResult.Body) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const ext = path.extname(objectKey).toLowerCase();

  // 3. Magic byte validation.
  const magicError = validateMagicBytes(buffer, ext);
  if (magicError) {
    await deleteR2Object(objectKey);
    logSecurityViolation({
      type: 'mime_spoofing_attempt',
      req,
      userId,
      intent: 'upload_resume',
      reason: magicError,
      extra: { objectKey, ext },
    });
    const error = new Error(magicError);
    (error as any).statusCode = 422;
    throw error;
  }

  // 4. Temp local write for AV scan (Option B).
  const tempDir = path.join(os.tmpdir(), 'kapit-av-scan');
  await fs.mkdir(tempDir, { recursive: true });
  const tempFileName = `${crypto.randomUUID()}${ext}`;
  const tempPath = path.join(tempDir, tempFileName);

  try {
    await fs.writeFile(tempPath, buffer, { flag: 'wx' });

    const scanResult = await scanFile({ absolutePath: tempPath });
    if (!scanResult.clean) {
      // Quarantine the temp file and delete from R2.
      await quarantineFile({ absolutePath: tempPath, storedName: tempFileName }).catch(() => {});
      await deleteR2Object(objectKey);

      logSecurityViolation({
        type: 'malware_detected',
        req,
        userId,
        intent: 'upload_resume',
        reason: scanResult.reason,
        extra: { objectKey },
      });

      const error = new Error(`Upload quarantined: ${scanResult.reason}`);
      (error as any).statusCode = 422;
      throw error;
    }
  } finally {
    // Clean up temp file regardless (it may have been moved by quarantine).
    await fs.unlink(tempPath).catch(() => {});
  }

  logger.info(
    { objectKey, actualSize, contentType: headResult.ContentType },
    'r2.verify.passed'
  );

  return {
    objectKey,
    size: actualSize,
    contentType: headResult.ContentType || expectedContentType,
    buffer,
  };
};

/**
 * Generate a time-limited presigned GET URL for secure downloads.
 * The URL expires after the configured TTL (default 15 minutes).
 */
const generatePresignedDownloadUrl = async ({ objectKey, expiresSeconds }) => {
  const ttl = Math.min(3600, Math.max(60, Number(expiresSeconds || 900)));

  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn: ttl });
};

/**
 * Delete an object from R2. Used for cleanup on failed verification.
 */
const deleteR2Object = async (objectKey) => {
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey,
      })
    );
    logger.info({ objectKey }, 'r2.object.deleted');
  } catch (deleteError) {
    logger.error({ objectKey, error: deleteError?.message }, 'r2.object.delete_failed');
  }
};

/**
 * Stream an R2 object body. Used by the download controller to pipe
 * the file to the response without buffering the full object in memory.
 */
const getR2ObjectStream = async ({ objectKey }) => {
  const result = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    })
  );

  return {
    body: result.Body,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
};

module.exports = {
  generatePresignedUploadUrl,
  verifyUploadedObject,
  generatePresignedDownloadUrl,
  deleteR2Object,
  getR2ObjectStream,
  buildObjectKey,
  sanitizeFileName,
  validateMagicBytes,
};
