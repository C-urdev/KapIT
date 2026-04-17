import { apiRequest } from './apiClient';

export const requestJobMatches = async ({ skills, experience }) => {
  const payload = {
    skills: Array.isArray(skills) ? skills : [],
    experience: String(experience || 'junior').trim().toLowerCase(),
  };

  const response = await apiRequest('/match-jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return Array.isArray(response?.matches) ? response.matches : [];
};
