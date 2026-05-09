const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const RESUME_UPLOAD_DIR = path.resolve(
  process.env.RESUME_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'resumes')
);
const MAX_RESUME_UPLOAD_BYTES = Math.max(64 * 1024, Number(process.env.RESUME_UPLOAD_MAX_BYTES || 5 * 1024 * 1024));
const RESUME_URL_PREFIX = '/api/developer/resumes/';
const PDF_SIGNATURE = Buffer.from('%PDF-');
const SAFE_FILE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

const ensureResumeDirectory = async () => {
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true });
};

const sanitizeOriginalName = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return 'resume.pdf';
  }

  return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
};

const buildStoredFilename = (originalName) => {
  const safeOriginalName = sanitizeOriginalName(originalName)
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'resume';

  return `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}.pdf`;
};

const assertPdfBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Resume upload is empty.');
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > MAX_RESUME_UPLOAD_BYTES) {
    const error = new Error(`Resume must be ${Math.floor(MAX_RESUME_UPLOAD_BYTES / (1024 * 1024))}MB or smaller.`);
    error.statusCode = 413;
    throw error;
  }

  if (buffer.length < PDF_SIGNATURE.length || !buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
    const error = new Error('Only valid PDF resumes are allowed.');
    error.statusCode = 400;
    throw error;
  }
};

const storeResumeUpload = async ({ buffer, originalName }) => {
  assertPdfBuffer(buffer);
  await ensureResumeDirectory();

  const storedName = buildStoredFilename(originalName);
  const absolutePath = path.join(RESUME_UPLOAD_DIR, storedName);
  await fs.writeFile(absolutePath, buffer, { flag: 'wx' });

  return {
    storedName,
    absolutePath,
    originalName: sanitizeOriginalName(originalName),
    size: buffer.length,
    url: `${RESUME_URL_PREFIX}${encodeURIComponent(storedName)}`,
  };
};

const getStoredResumePath = (storedName) => {
  const normalized = String(storedName || '').trim();
  if (!normalized || !SAFE_FILE_SEGMENT.test(normalized) || !normalized.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  const resolved = path.resolve(RESUME_UPLOAD_DIR, normalized);
  if (!resolved.startsWith(RESUME_UPLOAD_DIR)) {
    return null;
  }

  return resolved;
};

const getStoredNameFromResumeUrl = (resumeUrl) => {
  const normalized = String(resumeUrl || '').trim();
  if (!normalized.startsWith(RESUME_URL_PREFIX)) {
    return '';
  }

  const storedName = decodeURIComponent(normalized.slice(RESUME_URL_PREFIX.length));
  return SAFE_FILE_SEGMENT.test(storedName) ? storedName : '';
};

const getResumeDownloadName = (storedName) => {
  const normalized = String(storedName || '').trim();
  if (!normalized) {
    return 'resume.pdf';
  }

  const withoutPrefix = normalized.replace(/^\d+-[0-9a-f-]+-/i, '');
  return sanitizeOriginalName(withoutPrefix || 'resume.pdf');
};

module.exports = {
  MAX_RESUME_UPLOAD_BYTES,
  RESUME_URL_PREFIX,
  getResumeDownloadName,
  getStoredNameFromResumeUrl,
  getStoredResumePath,
  storeResumeUpload,
};
