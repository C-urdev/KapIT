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
};

export const saveDeveloperProfile = (profileInput) => developerAPI.saveProfile(profileInput);
