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
  uploadResume: (file) =>
    apiRequest(`${API_BASE}/resume`, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': 'application/pdf',
        'X-Upload-Filename': String(file?.name || 'resume.pdf'),
      },
    }),
};

export const saveDeveloperProfile = (profileInput) => developerAPI.saveProfile(profileInput);
