const API_URL = import.meta.env.VITE_API_BASE || '/api';
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();

const getToken = () => sessionStorage.getItem('token');

const getErrorMessage = (data, fallback) => data?.message || fallback;
const isServerFailure = (response) => response.status >= 500;

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const isEndpointCoolingDown = (key) => {
  const until = endpointCooldowns.get(key) || 0;
  return until > Date.now();
};

const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

const getHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getNotifications = async () => {
  if (isEndpointCoolingDown('notifications:list')) {
    return [];
  }

  const response = await fetch(`${API_URL}/notifications`, {
    headers: getHeaders(),
  });

  const data = await safeJson(response);
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed('notifications:list');
      return [];
    }
    throw new Error(getErrorMessage(data, 'Failed to load notifications'));
  }

  return Array.isArray(data.notifications) ? data.notifications : [];
};

export const getUnreadNotificationCount = async () => {
  if (isEndpointCoolingDown('notifications:unread-count')) {
    return 0;
  }

  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: getHeaders(),
  });

  const data = await safeJson(response);
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed('notifications:unread-count');
      return 0;
    }
    throw new Error(getErrorMessage(data, 'Failed to load unread notifications'));
  }

  return Number(data.unreadCount || 0);
};

export const markNotificationsRead = async () => {
  if (isEndpointCoolingDown('notifications:mark-read')) {
    return 0;
  }

  const response = await fetch(`${API_URL}/notifications/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  const data = await safeJson(response);
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed('notifications:mark-read');
      return 0;
    }
    throw new Error(getErrorMessage(data, 'Failed to mark notifications as read'));
  }

  return Number(data.updatedCount || 0);
};
