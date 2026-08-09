const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const RESUME_UPLOAD_DIR = path.resolve(
  process.env.RESUME_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'resumes')
);
const MAX_RESUME_UPLOAD_BYTES = Math.max(64 * 1024, Number(process.env.RESUME_UPLOAD_MAX_BYTES || 5 * 1024 * 1024));
const RESUME_URL_PREFIX = '/api/developer/resumes/';
const PDF_SIGNATURE = Buffer.from('%PDF-');
const DOC_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
const DOCX_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const SAFE_FILE_SEGMENT = /^[a-zA-Z0-9._-]+$/;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const MIME_TO_EXTENSION = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/octet-stream': '',
};

const ensureResumeDirectory = async () => {
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true });
};

const sanitizeOriginalName = (value, fallbackExtension = '.pdf') =>
  String(value || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ');

const sanitizeOriginalNameWithFallback = (value, fallbackExtension = '.pdf') => {
  const normalized = sanitizeOriginalName(value, fallbackExtension);

  if (!normalized) {
    return `resume${fallbackExtension}`;
  }

  const ext = path.extname(normalized).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return normalized;
  }
  return `${normalized}${fallbackExtension}`;
};

const buildStoredFilename = (originalName) => {
  const safeOriginalName = sanitizeOriginalNameWithFallback(originalName)
    .replace(/\.(pdf|doc|docx)$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'resume';
  const extension = path.extname(sanitizeOriginalNameWithFallback(originalName)).toLowerCase() || '.pdf';

  return `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}${extension}`;
};

const assertResumeBuffer = (buffer, extension) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Resume upload is empty.');
    (error as any).statusCode = 400;
    throw error;
  }

  if (buffer.length > MAX_RESUME_UPLOAD_BYTES) {
    const error = new Error(`Resume must be ${Math.floor(MAX_RESUME_UPLOAD_BYTES / (1024 * 1024))}MB or smaller.`);
    (error as any).statusCode = 413;
    throw error;
  }

  if (extension === '.pdf') {
    if (buffer.length < PDF_SIGNATURE.length || !buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
      const error = new Error('Only valid PDF resumes are allowed.');
      (error as any).statusCode = 400;
      throw error;
    }
  }
  if (extension === '.doc') {
    if (buffer.length < DOC_SIGNATURE.length || !buffer.subarray(0, DOC_SIGNATURE.length).equals(DOC_SIGNATURE)) {
      const error = new Error('Only valid DOC resumes are allowed.');
      (error as any).statusCode = 400;
      throw error;
    }
  }
  if (extension === '.docx') {
    if (buffer.length < DOCX_SIGNATURE.length || !buffer.subarray(0, DOCX_SIGNATURE.length).equals(DOCX_SIGNATURE)) {
      const error = new Error('Only valid DOCX resumes are allowed.');
      (error as any).statusCode = 400;
      throw error;
    }
  }
};

const resolveExtension = (originalName, contentType) => {
  const fromName = path.extname(String(originalName || '').trim()).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(fromName)) {
    return fromName;
  }
  const fromMime = MIME_TO_EXTENSION[String(contentType || '').toLowerCase()] || '';
  return ALLOWED_EXTENSIONS.has(fromMime) ? fromMime : '.pdf';
};

const storeResumeUpload = async ({ buffer, originalName, contentType }) => {
  const extension = resolveExtension(originalName, contentType);
  assertResumeBuffer(buffer, extension);
  await ensureResumeDirectory();

  const safeOriginalName = sanitizeOriginalNameWithFallback(originalName, extension);
  const storedName = buildStoredFilename(safeOriginalName);
  const absolutePath = path.join(RESUME_UPLOAD_DIR, storedName);
  await fs.writeFile(absolutePath, buffer, { flag: 'wx' });

  return {
    storedName,
    absolutePath,
    originalName: safeOriginalName,
    size: buffer.length,
    url: `${RESUME_URL_PREFIX}${encodeURIComponent(storedName)}`,
  };
};

const storeGeneratedResumeArtifact = async ({ buffer, fileName }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Generated resume file is empty.');
    (error as any).statusCode = 400;
    throw error;
  }
  await ensureResumeDirectory();
  const safeFileName = sanitizeOriginalNameWithFallback(fileName, path.extname(String(fileName || '') || '.pdf'));
  const storedName = buildStoredFilename(safeFileName);
  const absolutePath = path.join(RESUME_UPLOAD_DIR, storedName);
  await fs.writeFile(absolutePath, buffer, { flag: 'wx' });
  return {
    storedName,
    absolutePath,
    size: buffer.length,
    url: `${RESUME_URL_PREFIX}${encodeURIComponent(storedName)}`,
  };
};

const getStoredResumePath = (storedName) => {
  const normalized = String(storedName || '').trim();
  if (!normalized || !SAFE_FILE_SEGMENT.test(normalized)) {
    return null;
  }
  const extension = path.extname(normalized).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
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
  const extension = resolveExtension(withoutPrefix, '');
  return sanitizeOriginalNameWithFallback(withoutPrefix || `resume${extension}`, extension);
};

module.exports = {
  MAX_RESUME_UPLOAD_BYTES,
  RESUME_URL_PREFIX,
  getResumeDownloadName,
  getStoredNameFromResumeUrl,
  getStoredResumePath,
  storeResumeUpload,
  storeGeneratedResumeArtifact,
};
