import { apiRequest } from '@sharedServices/apiClient';
import { uploadToR2 } from '@sharedServices/r2UploadClient';

const API_BASE = '/api/developer';

const request = (path, { method = 'GET', body } = {}) =>
  apiRequest(`${API_BASE}${path}`, {
    method,
    body: body == null ? undefined : JSON.stringify(body),
  });

export const developerAPI = {
  saveProfile: (profileInput) => request('/profile', { method: 'PUT', body: profileInput }),
  getMyProfile: () => request('/profile'),
  optimizeResume: () => request('/ai/resume-optimize', { method: 'POST', body: {} }),
  useOptimizedResume: () => request('/ai/resume-use-optimized', { method: 'POST', body: {} }),

  /**
   * Upload a resume via Cloudflare R2 (presign → PUT → confirm).
   * Falls back to the legacy local upload if R2 is unavailable.
   */
  uploadResume: async (file, { onProgress } = {}) => {
    try {
      return await uploadToR2(file, { intent: 'resume', onProgress });
    } catch (error) {
      // If the backend says R2 is not configured (503), fall back to legacy local upload.
      if (error?.status === 503 || String(error?.message || '').includes('Cloud storage is not configured')) {
        return developerAPI.uploadResumeLegacy(file);
      }
      throw error;
    }
  },

  /** Legacy local upload – used as a fallback when R2 is disabled. */
  uploadResumeLegacy: (file) =>
    apiRequest(`${API_BASE}/resume`, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': String(file?.type || 'application/octet-stream'),
        'X-Upload-Filename': String(file?.name || 'resume'),
      },
    }),

  uploadResumeV2: (file) =>
    apiRequest('/api/resumes/upload', {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': String(file?.type || 'application/octet-stream'),
        'X-Upload-Filename': String(file?.name || 'resume'),
      },
    }),

  /**
   * Upload a profile image via Cloudflare R2.
   * Returns { profileImageUrl, objectKey }.
   */
  uploadProfileImage: async (file, { onProgress } = {}) => {
    return uploadToR2(file, { intent: 'profile_image', onProgress });
  },

  optimizeResumeById: (resumeId) => apiRequest(`/api/resumes/${encodeURIComponent(resumeId)}/optimize`, { method: 'POST', body: JSON.stringify({}) }),
  getResumeJob: (jobId) => apiRequest(`/api/resume-jobs/${encodeURIComponent(jobId)}`),
};

export const saveDeveloperProfile = (profileInput) => developerAPI.saveProfile(profileInput);
