// @ts-nocheck
/**
 * R2 Upload Client
 *
 * Coordinates the three-phase Cloudflare R2 upload flow:
 *   1. Request a presigned URL from the backend.
 *   2. PUT the file directly to Cloudflare R2 (bypasses the Node.js server).
 *   3. Confirm the upload with the backend (triggers AV scan + DB record).
 *
 * Usage:
 *   import { uploadToR2 } from '@sharedServices/r2UploadClient';
 *
 *   const result = await uploadToR2(file, { intent: 'resume' });
 *   // result = { resume: {...} }  (for resume intent)
 *
 *   const result = await uploadToR2(file, { intent: 'profile_image' });
 *   // result = { profileImageUrl: '...', objectKey: '...' }
 */
import { apiRequest } from './apiClient';

/**
 * Upload a File object to Cloudflare R2 via the backend's presign/confirm flow.
 *
 * @param {File} file            – The file to upload.
 * @param {object} options
 * @param {'resume'|'profile_image'} options.intent – What kind of upload this is.
 * @param {(progress: number) => void} [options.onProgress] – Optional 0-1 progress callback.
 * @returns {Promise<object>}    – The parsed JSON response from /api/uploads/confirm.
 */
export const uploadToR2 = async (file, { intent = 'resume', onProgress } = {}) => {
  if (!file || !(file instanceof Blob)) {
    throw new Error('A valid file is required.');
  }

  // ── Phase 1: Presign ──────────────────────────────────────────────
  const presignPayload = {
    intent,
    fileName: file.name || (intent === 'profile_image' ? 'profile.jpg' : 'resume.pdf'),
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };

  const presign = await apiRequest('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(presignPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!presign?.success || !presign.uploadUrl || !presign.objectKey) {
    throw new Error(presign?.error || 'Failed to get upload URL from server.');
  }

  const { uploadUrl, objectKey } = presign;

  // ── Phase 2: Direct upload to R2 ──────────────────────────────────
  // Use XMLHttpRequest for progress tracking if onProgress is provided.
  if (onProgress) {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded / e.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`R2 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during R2 upload.')));
      xhr.addEventListener('abort', () => reject(new Error('R2 upload was aborted.')));
      xhr.send(file);
    });
  } else {
    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });

    if (!putResponse.ok) {
      throw new Error(`R2 upload failed with status ${putResponse.status}`);
    }
  }

  // ── Phase 3: Confirm ──────────────────────────────────────────────
  const confirmPayload = {
    intent,
    objectKey,
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };

  const confirm = await apiRequest('/api/uploads/confirm', {
    method: 'POST',
    body: JSON.stringify(confirmPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!confirm?.success) {
    throw new Error(confirm?.error || 'Upload confirmation failed.');
  }

  return confirm;
};

/**
 * Resolve a profile image value into a displayable URL.
 *
 * Profile images stored in the database can be:
 *   - An R2 reference: "r2://uploads/userId/profile_images/..."
 *   - A Base64 data URL: "data:image/..."
 *   - An external URL: "https://..."
 *   - An empty string (no image)
 *
 * For R2 references, this function requests a short-lived presigned download URL.
 * For everything else, it returns the value as-is.
 */
const r2ImageCache = new Map();
const R2_CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes (presigned URLs last 60m)

export const resolveProfileImageUrl = async (imageRef) => {
  const ref = String(imageRef || '').trim();

  // Empty or non-R2 values pass through directly.
  if (!ref || !ref.startsWith('r2://')) {
    return ref;
  }

  // Check cache.
  const cached = r2ImageCache.get(ref);
  if (cached && Date.now() - cached.fetchedAt < R2_CACHE_TTL_MS) {
    return cached.url;
  }

  const objectKey = ref.replace(/^r2:\/\//, '');

  try {
    const data = await apiRequest('/api/uploads/resolve-image', {
      method: 'POST',
      body: JSON.stringify({ objectKey }),
      headers: { 'Content-Type': 'application/json' },
    });

    const url = data?.url || '';
    if (url) {
      r2ImageCache.set(ref, { url, fetchedAt: Date.now() });
    }
    return url;
  } catch {
    // If resolution fails, return empty so a fallback avatar is shown.
    return '';
  }
};
