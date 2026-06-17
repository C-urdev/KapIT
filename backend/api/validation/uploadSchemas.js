const { z } = require('zod');
const path = require('path');
const { getR2UploadMaxBytes } = require('../config/r2');

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const CONTENT_TYPE_TO_EXTENSION = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const hasAllowedExtension = (fileName) => {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

const buildPresignSchema = () =>
  z.object({
    fileName: z
      .string()
      .min(1, 'File name is required.')
      .max(255, 'File name is too long.')
      .refine(hasAllowedExtension, {
        message: 'Only .pdf, .doc, and .docx files are allowed.',
      }),
    contentType: z.enum(ALLOWED_CONTENT_TYPES, {
      errorMap: () => ({ message: 'Unsupported file type. Only PDF, DOC, and DOCX are accepted.' }),
    }),
    fileSize: z
      .number({ invalid_type_error: 'File size must be a number.' })
      .int('File size must be a whole number.')
      .positive('File size must be positive.')
      .max(getR2UploadMaxBytes(), 'File exceeds the maximum upload size.'),
  });

const buildConfirmSchema = () =>
  z.object({
    objectKey: z
      .string()
      .min(10, 'Invalid object key.')
      .max(512, 'Object key is too long.')
      .refine((key) => key.startsWith('uploads/'), {
        message: 'Invalid object key format.',
      }),
    contentType: z.enum(ALLOWED_CONTENT_TYPES, {
      errorMap: () => ({ message: 'Unsupported file type.' }),
    }),
    fileSize: z
      .number({ invalid_type_error: 'File size must be a number.' })
      .int()
      .positive()
      .max(getR2UploadMaxBytes(), 'File exceeds the maximum upload size.'),
  });

module.exports = {
  ALLOWED_CONTENT_TYPES,
  ALLOWED_EXTENSIONS,
  CONTENT_TYPE_TO_EXTENSION,
  buildPresignSchema,
  buildConfirmSchema,
};
