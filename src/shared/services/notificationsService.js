const API_URL = import.meta.env.VITE_API_BASE || '/api';

const getToken = () => sessionStorage.getItem('token');

const getErrorMessage = (data, fallback) => data?.message || fallback;

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
  const response = await fetch(`${API_URL}/notifications`, {
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load notifications'));
  }

  return Array.isArray(data.notifications) ? data.notifications : [];
};

export const getUnreadNotificationCount = async () => {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load unread notifications'));
  }

  return Number(data.unreadCount || 0);
};

export const markNotificationsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to mark notifications as read'));
  }

  return Number(data.updatedCount || 0);
};
