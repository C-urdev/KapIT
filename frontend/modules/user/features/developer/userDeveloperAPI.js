import { apiRequest } from '@sharedServices/apiClient';

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
  uploadResume: (file) =>
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
  optimizeResumeById: (resumeId) => apiRequest(`/api/resumes/${encodeURIComponent(resumeId)}/optimize`, { method: 'POST', body: JSON.stringify({}) }),
  getResumeJob: (jobId) => apiRequest(`/api/resume-jobs/${encodeURIComponent(jobId)}`),
};

export const saveDeveloperProfile = (profileInput) => developerAPI.saveProfile(profileInput);
