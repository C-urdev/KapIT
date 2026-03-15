const API_URL = import.meta.env.VITE_API_URL || '/api/auth';
const PROFILE_CACHE_KEY = 'kapit_profile_cache_by_email';

const getErrorMessage = (data, fallbackMessage) => {
  if (data?.errors?.length) {
    return data.errors.map((err) => err.message).join(', ');
  }

  return data?.message || fallbackMessage;
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
    const raw = localStorage.getItem('user');
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
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeProfileCache = (cache) => {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mergedUser));
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mergedUser));
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
    const token = localStorage.getItem('token');

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
  const token = localStorage.getItem('token');
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
  localStorage.setItem('user', JSON.stringify(mergedUser));
  saveProfileCacheForUser(mergedUser);
  data.user = mergedUser;

  return data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getStoredUser = () => {
  const user = localStorage.getItem('user');
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
  localStorage.setItem('user', JSON.stringify(nextUser));
  saveProfileCacheForUser(nextUser);
  return nextUser;
};

export const searchAccounts = async (query) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
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
