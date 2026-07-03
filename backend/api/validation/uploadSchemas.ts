const { z } = require('zod');
const path = require('path');
const { getR2UploadMaxBytes } = require('../config/r2');

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp']);

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const hasAllowedExtension = (fileName: string): boolean => {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

const buildPresignSchema = () =>
  z.object({
    intent: z.enum(['resume', 'profile_image']).default('resume'),
    fileName: z
      .string()
      .min(1, 'File name is required.')
      .max(255, 'File name is too long.')
      .refine(hasAllowedExtension, {
        message: 'Unsupported file extension.',
      }),
    contentType: z.enum(ALLOWED_CONTENT_TYPES, {
      errorMap: () => ({ message: 'Unsupported file type.' }),
    }),
    fileSize: z
      .number({ invalid_type_error: 'File size must be a number.' })
      .int('File size must be a whole number.')
      .positive('File size must be positive.')
      .max(getR2UploadMaxBytes(), 'File exceeds the maximum upload size.'),
  });

const buildConfirmSchema = () =>
  z.object({
    intent: z.enum(['resume', 'profile_image']).default('resume'),
    objectKey: z
      .string()
      .min(10, 'Invalid object key.')
      .max(512, 'Object key is too long.')
      .refine((key: string) => key.startsWith('uploads/'), {
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
