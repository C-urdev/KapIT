const API_URL = import.meta.env.VITE_API_URL || '/api/auth';
const PROFILE_CACHE_KEY = 'kapit_profile_cache_by_email';

const getErrorMessage = (data, fallbackMessage) => {
  if (data?.errors?.length) {
    return data.errors.map((err) => err.message).join(', ');
  }

  return data?.message || fallbackMessage;
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

// Register user
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Registration failed'));
    }

    // Store token in localStorage
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

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Login failed'));
    }

    // Store token in localStorage
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

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Failed to get user'));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Update current user's profile (requires auth)
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

  const data = await response.json();
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

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get stored user
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

// Persist updated user data
export const updateStoredUser = (updates) => {
  const currentUser = getStoredUser() || {};
  const nextUser = { ...currentUser, ...updates };
  localStorage.setItem('user', JSON.stringify(nextUser));
  saveProfileCacheForUser(nextUser);
  return nextUser;
};

// Search users/companies (requires auth)
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Search failed'));
  }

  return Array.isArray(data.results) ? data.results : [];
};

// Get public profile by id (requires auth)
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load profile'));
  }

  return data.profile || null;
};
