import { apiRequest } from './apiClient';

const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map<string, number>();
const readCache = (key: string, fallback: unknown) => {
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

const writeCache = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore cache write failures
  }
};

const isEndpointCoolingDown = (key: string): boolean => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key: string): void => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

export const getNotifications = async () => {
  if (isEndpointCoolingDown('notifications:list')) {
    throw new Error('Notifications are temporarily unavailable. Please try again in a minute.');
  }

  try {
    const data = await apiRequest('/notifications');
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    writeCache('kapit_notifications_list', notifications);
    return notifications;
  } catch (error: any) {
    markEndpointFailed('notifications:list');
    const cached = readCache('kapit_notifications_list', []);
    if (cached.length > 0) {
      return cached;
    }
    throw new Error(error?.message || 'Failed to load notifications');
  }
};

export const getUnreadNotificationCount = async () => {
  if (isEndpointCoolingDown('notifications:unread-count')) {
    throw new Error('Notifications are temporarily unavailable. Please try again in a minute.');
  }

  try {
    const data = await apiRequest('/notifications/unread-count');
    const count = Number(data.unreadCount || 0);
    writeCache('kapit_notifications_unread_count', count);
    return count;
  } catch (error: any) {
    markEndpointFailed('notifications:unread-count');
    throw new Error(error?.message || 'Failed to load unread notification count');
  }
};

export const markNotificationsRead = async () => {
  if (isEndpointCoolingDown('notifications:mark-read')) {
    return 0;
  }

  try {
    const data = await apiRequest('/notifications/read', {
      method: 'PATCH',
    });
    writeCache('kapit_notifications_unread_count', 0);
    return Number(data.updatedCount || 0);
  } catch (error: any) {
    markEndpointFailed('notifications:mark-read');
    throw new Error(error?.message || 'Failed to mark notifications as read');
  }
};
