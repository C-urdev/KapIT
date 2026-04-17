import { authRequest } from './apiClient';

const PROFILE_CACHE_KEY = 'kapit_profile_cache_by_email';
const USER_STORAGE_KEY = 'user';
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();
const getSessionStorage = () => window.sessionStorage;
let hasClearedLegacyBrowserAuthState = false;

const clearLegacyBrowserAuthStateOnce = () => {
  if (typeof window === 'undefined' || hasClearedLegacyBrowserAuthState) {
    return;
  }

  hasClearedLegacyBrowserAuthState = true;
  try {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
    window.sessionStorage.removeItem('token');
  } catch {
    // Ignore storage access failures from restricted browser contexts.
  }
};

const getErrorMessage = (error, fallbackMessage) => error?.message || fallbackMessage;
const normalizeAccountType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'company') return 'company';
  if (normalized === 'developer' || normalized === 'employee' || normalized === 'user') return 'developer';
  return null;
};
const getUserAccountType = (user) => (
  normalizeAccountType(user?.accountType) || normalizeAccountType(user?.account_type) || normalizeAccountType(user?.type)
);
const isCompanyAccount = (user) => getUserAccountType(user) === 'company';
const isEndpointCoolingDown = (key) => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

const clearLocalSessionState = () => {
  clearLegacyBrowserAuthStateOnce();
  try {
    const storage = getSessionStorage();
    storage.removeItem(USER_STORAGE_KEY);
    storage.removeItem(PROFILE_CACHE_KEY);
    storage.removeItem('token');
  } catch {
    // Ignore storage access failures.
  }
};

const getStoredUserSafe = () => {
  clearLegacyBrowserAuthStateOnce();
  try {
    const raw = getSessionStorage().getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readProfileCache = () => {
  clearLegacyBrowserAuthStateOnce();
  try {
    const raw = getSessionStorage().getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeProfileCache = (cache) => {
  clearLegacyBrowserAuthStateOnce();
  getSessionStorage().setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
};

const getUserEmailKey = (user) => {
  const email = user?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const pickLocalProfileFields = (user) => ({
  profileImage: user?.profileImage || '',
  bio: user?.bio || '',
  socials: user?.socials || '',
  username: user?.username || '',
  name: user?.name || '',
  companyName: user?.companyName || '',
  industry: user?.industry || '',
  companySize: user?.companySize || '',
  website: user?.website || '',
  hiringFor: user?.hiringFor || '',
  desiredJob: user?.desiredJob || '',
  address: user?.address || '',
  education: user?.education || '',
  vocationalCourse: user?.vocationalCourse || '',
  birthday: user?.birthday || '',
  age: user?.age || '',
  sex: user?.sex || '',
  phone: user?.phone || '',
  fullName: user?.fullName || '',
  location: user?.location || '',
  phoneNumber: user?.phoneNumber || '',
  jobTitle: user?.jobTitle || '',
  yearsOfExperience: user?.yearsOfExperience || '',
  skills: Array.isArray(user?.skills) ? user.skills : [],
  preferredRole: user?.preferredRole || '',
  educationAttainment: user?.educationAttainment || '',
  school: user?.school || '',
  certifications: user?.certifications || '',
  github: user?.github || '',
  portfolioWebsite: user?.portfolioWebsite || '',
  linkedin: user?.linkedin || '',
  otherLinks: user?.otherLinks || '',
  workPreference: user?.workPreference || '',
  aboutMe: user?.aboutMe || '',
  resume: user?.resume || '',
  projects: Array.isArray(user?.projects) ? user.projects : [],
  projectCount: Number.isFinite(Number(user?.projectCount))
    ? Number(user.projectCount)
    : Array.isArray(user?.projects)
      ? user.projects.length
      : 0,
  logoUrl: user?.logoUrl || '',
  description: user?.description || '',
  contactEmail: user?.contactEmail || '',
  servicesNeeded: Array.isArray(user?.servicesNeeded) ? user.servicesNeeded : [],
  projectTitle: user?.projectTitle || '',
  projectDescription: user?.projectDescription || '',
  budgetRange: user?.budgetRange || '',
  timeline: user?.timeline || '',
  termsAccepted: Boolean(user?.termsAccepted),
  termsAcceptedAt: user?.termsAcceptedAt || null,
  profileCompleted: Boolean(user?.profileCompleted),
});

const saveProfileCacheForUser = (user) => {
  const emailKey = getUserEmailKey(user);
  if (!emailKey) {
    return;
  }

  const cache = readProfileCache();
  cache[emailKey] = {
    ...(cache[emailKey] || {}),
    ...pickLocalProfileFields(user),
  };
  writeProfileCache(cache);
};

const mergeWithProfileCache = (user) => {
  const emailKey = getUserEmailKey(user);
  if (!emailKey) {
    return user;
  }

  const cache = readProfileCache();
  return {
    ...cache[emailKey],
    ...user,
  };
};

const persistUser = (user) => {
  clearLegacyBrowserAuthStateOnce();
  if (!user) {
    return null;
  }

  const canonicalAccountType = getUserAccountType(user);
  const mergedUser = mergeWithProfileCache({
    ...user,
    ...(canonicalAccountType ? { accountType: canonicalAccountType } : {}),
    ...(canonicalAccountType === 'company' ? { type: 'company' } : {}),
  });
  getSessionStorage().setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser));
  saveProfileCacheForUser(mergedUser);
  return mergedUser;
};

export const getCachedProfileForEmail = (email) => {
  const emailKey = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailKey) {
    return null;
  }

  const cache = readProfileCache();
  return cache[emailKey] || null;
};
export { normalizeAccountType, getUserAccountType, isCompanyAccount };

export const registerUser = async (userData) => {
  const payload = { ...(userData || {}) };
  const accountType = String(payload.accountType || payload.account_type || '').trim().toLowerCase();
  const legacyUserType = String(payload.userType || '').trim().toLowerCase();

  if (accountType === 'developer') {
    payload.userType = 'employee';
    payload.accountType = 'developer';
  } else if (accountType === 'company') {
    payload.userType = 'company';
    payload.accountType = 'company';
  } else if (legacyUserType === 'employee') {
    payload.userType = 'employee';
    payload.accountType = 'developer';
  } else if (legacyUserType === 'company') {
    payload.userType = 'company';
    payload.accountType = 'company';
  }

  const data = await authRequest('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    retryOnUnauthorized: false,
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const loginUser = async (credentials) => {
  const data = await authRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    retryOnUnauthorized: false,
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const loginWithGoogle = async (credential) => {
  const data = await authRequest('/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
    retryOnUnauthorized: false,
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const loginWithGithub = async (code) => {
  const data = await authRequest('/github', {
    method: 'POST',
    body: JSON.stringify({ code }),
    retryOnUnauthorized: false,
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const sendRegistrationOtp = async ({ email }) => {
  return authRequest('/send-registration-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
    retryOnUnauthorized: false,
  });
};

export const verifyRegistrationOtp = async ({ email, code }) => {
  return authRequest('/verify-registration-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
    retryOnUnauthorized: false,
  });
};

export const requestPasswordReset = async ({ email }) => {
  return authRequest('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    retryOnUnauthorized: false,
  });
};

export const resetPasswordWithToken = async ({ token, newPassword }) => {
  return authRequest('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
    retryOnUnauthorized: false,
  });
};

export const sendPasswordResetOtp = async ({ email }) => {
  return authRequest('/forgot-password-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
    retryOnUnauthorized: false,
  });
};

export const verifyPasswordResetOtp = async ({ email, code }) => {
  return authRequest('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
    retryOnUnauthorized: false,
  });
};

export const resetPasswordWithOtp = async ({ resetToken, newPassword }) => {
  return authRequest('/reset-password-otp', {
    method: 'POST',
    body: JSON.stringify({ resetToken, new_password: newPassword }),
    retryOnUnauthorized: false,
  });
};

export const refreshCurrentSession = async () => {
  const data = await authRequest('/refresh', {
    method: 'POST',
    retryOnUnauthorized: false,
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const getCurrentUser = async () => {
  const data = await authRequest('/me');
  if (data?.user) {
    data.user = persistUser(data.user);
  }
  return data;
};

export const updateMyProfile = async (updates) => {
  const data = await authRequest('/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates || {}),
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const acceptTermsAndConditions = async () => {
  const data = await authRequest('/terms-consent', {
    method: 'PATCH',
    body: JSON.stringify({ agreed: true }),
  });

  if (data?.user) {
    data.user = persistUser(data.user);
  }

  return data;
};

export const getMyApplications = async () => {
  const data = await authRequest('/applications');
  return Array.isArray(data?.applications) ? data.applications : [];
};

export const logoutUser = async () => {
  clearLocalSessionState();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), 1800)
    : null;

  try {
    await authRequest('/logout', {
      method: 'POST',
      retryOnUnauthorized: false,
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch {
    // Clear local user state even if the server cookie is already gone.
  } finally {
    if (timeout != null) {
      clearTimeout(timeout);
    }
  }
};

export const isAuthenticated = () => Boolean(getStoredUserSafe());
export const getStoredUser = () => getStoredUserSafe();

export const updateStoredUser = (updates) => {
  const currentUser = getStoredUserSafe() || {};
  const nextUser = { ...currentUser, ...updates };
  getSessionStorage().setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  saveProfileCacheForUser(nextUser);
  return nextUser;
};

export const searchAccounts = async (query) => {
  const data = await authRequest(`/search?q=${encodeURIComponent(query)}`);
  return Array.isArray(data?.results) ? data.results : [];
};

export const getPublicProfile = async (userId) => {
  const data = await authRequest(`/profile/${encodeURIComponent(userId)}`);
  return data?.profile || null;
};

export const getFeaturedCompanies = async () => {
  try {
    const data = await authRequest('/featured-companies');
    return Array.isArray(data?.companies) ? data.companies : [];
  } catch {
    return [];
  }
};

export const getJobsFeed = async (filters = {}) => {
  if (isEndpointCoolingDown('auth:jobs-feed')) {
    return { jobs: [], plan: { isPremium: false } };
  }

  try {
    const params = new URLSearchParams();
    if (filters && typeof filters === 'object') {
      if (filters.q) params.set('q', String(filters.q).trim());
      if (filters.location) params.set('location', String(filters.location).trim());
      if (filters.type) params.set('type', String(filters.type).trim());
      if (filters.skill) params.set('skill', String(filters.skill).trim());
      if (filters.status) params.set('status', String(filters.status).trim());
    }

    const query = params.toString();
    const data = await authRequest(`/jobs${query ? `?${query}` : ''}`);
    return {
      jobs: Array.isArray(data?.jobs) ? data.jobs : [],
      plan: data?.plan || { isPremium: false },
    };
  } catch (error) {
    markEndpointFailed('auth:jobs-feed');
    throw new Error(getErrorMessage(error, 'Failed to load jobs'));
  }
};

export const getSavedJobs = async () => {
  const data = await authRequest('/saved-jobs');
  return Array.isArray(data?.savedJobs) ? data.savedJobs : [];
};

export const saveJob = async (jobId) =>
  authRequest('/saved-jobs', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  });

export const removeSavedJob = async (jobId) =>
  authRequest(`/saved-jobs/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  });

export const applyToJob = async (jobId) => {
  return authRequest(`/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: 'POST',
  });
};
