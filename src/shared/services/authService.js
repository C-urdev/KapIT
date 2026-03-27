const API_URL = import.meta.env.VITE_API_URL || '/api/auth';
const PROFILE_CACHE_KEY = 'kapit_profile_cache_by_email';
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();
const getSessionStorage = () => window.sessionStorage;

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  window.localStorage.removeItem(PROFILE_CACHE_KEY);
}

const getErrorMessage = (data, fallbackMessage) => {
  if (data?.errors?.length) {
    return data.errors.map((err) => err.message).join(', ');
  }

  return data?.message || fallbackMessage;
};

const isServerFailure = (response) => response.status >= 500;

const isEndpointCoolingDown = (key) => {
  const until = endpointCooldowns.get(key) || 0;
  return until > Date.now();
};

const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  const normalizedText = rawText.trim();

  if (normalizedText.startsWith('<!DOCTYPE') || normalizedText.startsWith('<html')) {
    throw new Error('API returned HTML instead of JSON. Check your Vercel API deployment and environment variables.');
  }

  try {
    return JSON.parse(normalizedText);
  } catch {
    throw new Error(normalizedText || fallbackMessage);
  }
};

const getStoredUserSafe = () => {
  try {
    const raw = getSessionStorage().getItem('user');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readProfileCache = () => {
  try {
    const raw = getSessionStorage().getItem(PROFILE_CACHE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeProfileCache = (cache) => {
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
  logoUrl: user?.logoUrl || '',
  description: user?.description || '',
  contactEmail: user?.contactEmail || '',
  servicesNeeded: Array.isArray(user?.servicesNeeded) ? user.servicesNeeded : [],
  projectTitle: user?.projectTitle || '',
  projectDescription: user?.projectDescription || '',
  budgetRange: user?.budgetRange || '',
  timeline: user?.timeline || '',
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

export const getCachedProfileForEmail = (email) => {
  const emailKey = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailKey) {
    return null;
  }

  const cache = readProfileCache();
  return cache[emailKey] || null;
};

export const registerUser = async (userData) => {
  try {
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

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseApiResponse(response, 'Registration failed');

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Registration failed'));
    }

    if (data.token) {
      const existingUser = getStoredUserSafe() || {};
      const mergedUser = mergeWithProfileCache({ ...existingUser, ...data.user });
      getSessionStorage().setItem('token', data.token);
      getSessionStorage().setItem('user', JSON.stringify(mergedUser));
      saveProfileCacheForUser(mergedUser);
      data.user = mergedUser;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await parseApiResponse(response, 'Login failed');

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Login failed'));
    }

    if (data.token) {
      const existingUser = getStoredUserSafe() || {};
      const mergedUser = mergeWithProfileCache({ ...existingUser, ...data.user });
      getSessionStorage().setItem('token', data.token);
      getSessionStorage().setItem('user', JSON.stringify(mergedUser));
      saveProfileCacheForUser(mergedUser);
      data.user = mergedUser;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = getSessionStorage().getItem('token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseApiResponse(response, 'Failed to get user');

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Failed to get user'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const updateMyProfile = async (updates) => {
  const token = getSessionStorage().getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates || {}),
  });

  const data = await parseApiResponse(response, 'Failed to update profile');
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to update profile'));
  }

  const existingUser = getStoredUserSafe() || {};
  const mergedUser = mergeWithProfileCache({ ...existingUser, ...(data.user || {}) });
  getSessionStorage().setItem('user', JSON.stringify(mergedUser));
  saveProfileCacheForUser(mergedUser);
  data.user = mergedUser;

  return data;
};

export const logoutUser = () => {
  getSessionStorage().removeItem('token');
  getSessionStorage().removeItem('user');
};

export const isAuthenticated = () => {
  const token = getSessionStorage().getItem('token');
  return !!token;
};

export const getStoredUser = () => {
  const user = getSessionStorage().getItem('user');
  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const updateStoredUser = (updates) => {
  const currentUser = getStoredUser() || {};
  const nextUser = { ...currentUser, ...updates };
  getSessionStorage().setItem('user', JSON.stringify(nextUser));
  saveProfileCacheForUser(nextUser);
  return nextUser;
};

export const searchAccounts = async (query) => {
  const token = getSessionStorage().getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await parseApiResponse(response, 'Search failed');
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Search failed'));
  }

  return Array.isArray(data.results) ? data.results : [];
};

export const getPublicProfile = async (userId) => {
  const token = getSessionStorage().getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/profile/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await parseApiResponse(response, 'Failed to load profile');
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load profile'));
  }

  return data.profile || null;
};

export const getJobsFeed = async () => {
  if (isEndpointCoolingDown('auth:jobs-feed')) {
    return [];
  }

  const token = getSessionStorage().getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/jobs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await parseApiResponse(response, 'Failed to load jobs');
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed('auth:jobs-feed');
      return [];
    }
    throw new Error(getErrorMessage(data, 'Failed to load jobs'));
  }

  return Array.isArray(data.jobs) ? data.jobs : [];
};

export const applyToJob = async (jobId) => {
  const token = getSessionStorage().getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await parseApiResponse(response, 'Failed to apply to job');
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to apply to job'));
  }

  return data;
};



