import { apiRequest } from '@sharedServices/apiClient';

const API_BASE = '/api/company';
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();
const unwrapEnvelope = (response) => {
  if (
    response &&
    typeof response === 'object' &&
    response.success === true &&
    response.data &&
    typeof response.data === 'object'
  ) {
    return { ...response.data, success: true };
  }
  return response;
};

const isServerFailure = (error) => /request failed/i.test(String(error?.message || ''));
const getCooldownKey = (path, method) => `${String(method || 'GET').toUpperCase()}:${path}`;
const isEndpointCoolingDown = (key) => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

const request = async (path, {
  method = 'GET',
  body,
  fallbackData,
  headers,
} = {}) => {
  const cooldownKey = getCooldownKey(path, method);
  if (fallbackData !== undefined && isEndpointCoolingDown(cooldownKey)) {
    return fallbackData;
  }

  try {
    const response = await apiRequest(`${API_BASE}${path}`, {
      method,
      body: body == null ? undefined : JSON.stringify(body),
      headers,
    });
    return unwrapEnvelope(response);
  } catch (error) {
    if (fallbackData !== undefined && isServerFailure(error)) {
      markEndpointFailed(cooldownKey);
      return fallbackData;
    }
    throw error;
  }
};

export const companyAPI = {
  createDraftJob: (jobInput) => request('/jobs/draft', { method: 'POST', body: jobInput }),
  getPaymentPlans: () => request('/payments/plans'),
  getPaymentProviders: () => request('/payments/providers'),
  createPaymentCheckoutSession: (input, options = {}) => request('/payments/checkout-session', {
    method: 'POST',
    body: input,
    headers: options.headers,
  }),
  completeLocalBypassCheckout: (input) => request('/payments/localhost-bypass', { method: 'POST', body: input }),
  capturePayPalCheckout: (input) => request('/payments/paypal/capture', { method: 'POST', body: input }),
  cancelPaymentCheckout: (paymentId) => request(`/payments/${paymentId}/cancel`, { method: 'POST' }),
  getProfile: () => request('/profile'),
  createJob: (jobInput) => request('/jobs', { method: 'POST', body: jobInput }),
  getJobs: () => request('/jobs'),
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),
  updateJobStatus: (jobId, status) => request(`/jobs/${jobId}/status`, { method: 'PATCH', body: { status } }),
  reopenJob: (jobId) => request(`/jobs/${jobId}/reopen`, { method: 'POST' }),
  rankApplicantsForJob: (jobId) => request(`/jobs/${jobId}/ai/rank-applicants`),
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
