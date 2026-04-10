import { apiRequest } from './apiClient';

const API_URL = ((typeof process !== 'undefined' && process?.env?.VITE_API_BASE) || '/api');
const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();

const isEndpointCoolingDown = (key) => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

export const listConversations = async () => {
  if (isEndpointCoolingDown('messages:conversations')) {
    return [];
  }

  try {
    const data = await apiRequest(`${API_URL}/messages/conversations`);
    return data.conversations || [];
  } catch {
    markEndpointFailed('messages:conversations');
    return [];
  }
};

export const getMessages = async (contactId) => {
  const cooldownKey = `messages:thread:${String(contactId || '')}`;
  if (isEndpointCoolingDown(cooldownKey)) {
    return [];
  }

  try {
    const data = await apiRequest(`${API_URL}/messages/${encodeURIComponent(contactId)}`);
    return data.messages || [];
  } catch {
    markEndpointFailed(cooldownKey);
    return [];
  }
};

export const sendMessage = async (contactId, text) => {
  const data = await apiRequest(`${API_URL}/messages/${encodeURIComponent(contactId)}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  return data.message;
};
