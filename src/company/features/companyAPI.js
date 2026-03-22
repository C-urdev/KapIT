const API_BASE = '/api/company';

const getToken = () => localStorage.getItem('token');

const request = async (path, { method = 'GET', body } = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const companyAPI = {
  getProfile: () => request('/profile'),
  createJob: (jobInput) => request('/jobs', { method: 'POST', body: jobInput }),
  getJobs: () => request('/jobs'),
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),
  updateJobStatus: (jobId, status) => request(`/jobs/${jobId}/status`, { method: 'PATCH', body: { status } }),
  reopenJob: (jobId) => request(`/jobs/${jobId}/reopen`, { method: 'POST' }),
  getApplicants: () => request('/applicants'),
  updateApplicantStatus: (applicationId, status) => request(`/applications/${applicationId}/status`, { method: 'PATCH', body: { status } }),
  searchDevelopers: (input) => {
    if (input && typeof input === 'object') {
      const params = new URLSearchParams();
      if (input.q) params.set('q', String(input.q));
      if (input.skill) params.set('skill', String(input.skill));
      if (input.location) params.set('location', String(input.location));
      if (input.minExperience != null && String(input.minExperience).trim() !== '') {
        params.set('minExperience', String(input.minExperience));
      }
      const query = params.toString();
      return request(`/developers${query ? `?${query}` : ''}`);
    }
    return request(`/developers?q=${encodeURIComponent(input || '')}`);
  },
  getAnalytics: () => request('/analytics'),
  updateProfile: (profileInput) => request('/profile', { method: 'PUT', body: profileInput }),
  saveOnboardingProfile: (profileInput) => request('/onboarding/profile', { method: 'PUT', body: profileInput }),
};

export const saveCompanyProfileOnboarding = (profileInput) => companyAPI.saveOnboardingProfile(profileInput);



