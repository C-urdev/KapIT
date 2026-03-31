const API_BASE = '/api/company';
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();

const getToken = () => sessionStorage.getItem('token');
const isServerFailure = (response) => response.status >= 500;

const getCooldownKey = (path, method) => `${String(method || 'GET').toUpperCase()}:${path}`;

const isEndpointCoolingDown = (key) => {
  const until = endpointCooldowns.get(key) || 0;
  return until > Date.now();
};

const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

const request = async (path, { method = 'GET', body, fallbackData } = {}) => {
  const cooldownKey = getCooldownKey(path, method);
  if (fallbackData !== undefined && isEndpointCoolingDown(cooldownKey)) {
    return fallbackData;
  }

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
    if (fallbackData !== undefined && isServerFailure(response)) {
      markEndpointFailed(cooldownKey);
      return fallbackData;
    }
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const companyAPI = {
  createDraftJob: (jobInput) => request('/jobs/draft', { method: 'POST', body: jobInput }),
  getPaymentPlans: () => request('/payments/plans'),
  getPaymentProviders: () => request('/payments/providers'),
  createPaymentCheckoutSession: (input) => request('/payments/checkout-session', { method: 'POST', body: input }),
  verifyStripeCheckout: (input) => request('/payments/stripe/verify', { method: 'POST', body: input }),
  capturePayPalCheckout: (input) => request('/payments/paypal/capture', { method: 'POST', body: input }),
  cancelPaymentCheckout: (paymentId) => request(`/payments/${paymentId}/cancel`, { method: 'POST' }),
  getProfile: () => request('/profile'),
  createJob: (jobInput) => request('/jobs', { method: 'POST', body: jobInput }),
  getJobs: () => request('/jobs', { fallbackData: { success: true, jobs: [] } }),
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),
  updateJobStatus: (jobId, status) => request(`/jobs/${jobId}/status`, { method: 'PATCH', body: { status } }),
  reopenJob: (jobId) => request(`/jobs/${jobId}/reopen`, { method: 'POST' }),
  getApplicants: () => request('/applicants', { fallbackData: { success: true, applicants: [] } }),
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
  getAnalytics: () => request('/analytics', {
    fallbackData: {
      success: true,
      analytics: {
        totalJobs: 0,
        totalApplicants: 0,
        jobsByStatus: {},
        applicantsByStatus: {},
      },
    },
  }),
  updateProfile: (profileInput) => request('/profile', { method: 'PUT', body: profileInput }),
  saveOnboardingProfile: (profileInput) => request('/onboarding/profile', { method: 'PUT', body: profileInput }),
};

export const saveCompanyProfileOnboarding = (profileInput) => companyAPI.saveOnboardingProfile(profileInput);



