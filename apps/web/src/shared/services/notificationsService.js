import { apiRequest } from './apiClient';

const API_URL = ((typeof process !== 'undefined' && process?.env?.VITE_API_BASE) || '/api');
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();
const readCache = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeCache = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore cache write failures
  }
};

const isEndpointCoolingDown = (key) => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

export const getNotifications = async () => {
  if (isEndpointCoolingDown('notifications:list')) {
    return readCache('kapit_notifications_list', []);
  }

  try {
    const data = await apiRequest(`${API_URL}/notifications`);
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    writeCache('kapit_notifications_list', notifications);
    return notifications;
  } catch {
    markEndpointFailed('notifications:list');
    return readCache('kapit_notifications_list', []);
  }
};

export const getUnreadNotificationCount = async () => {
  if (isEndpointCoolingDown('notifications:unread-count')) {
    return readCache('kapit_notifications_unread_count', 0);
  }

  try {
    const data = await apiRequest(`${API_URL}/notifications/unread-count`);
    const count = Number(data.unreadCount || 0);
    writeCache('kapit_notifications_unread_count', count);
    return count;
  } catch {
    markEndpointFailed('notifications:unread-count');
    return readCache('kapit_notifications_unread_count', 0);
  }
};

export const markNotificationsRead = async () => {
  if (isEndpointCoolingDown('notifications:mark-read')) {
    return 0;
  }

  try {
    const data = await apiRequest(`${API_URL}/notifications/read`, {
      method: 'PATCH',
    });
    writeCache('kapit_notifications_unread_count', 0);
    return Number(data.updatedCount || 0);
  } catch {
    markEndpointFailed('notifications:mark-read');
    return 0;
  }
};
