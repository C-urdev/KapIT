import { apiRequest } from './apiClient';

const SERVER_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();

const isEndpointCoolingDown = (key) => (endpointCooldowns.get(key) || 0) > Date.now();
const markEndpointFailed = (key) => {
  endpointCooldowns.set(key, Date.now() + SERVER_COOLDOWN_MS);
};

export const listConversations = async () => {
  if (isEndpointCoolingDown('messages:conversations')) {
    throw new Error('Messages are temporarily unavailable. Please try again in a minute.');
  }

  try {
    const data = await apiRequest('/messages/conversations');
    return data.conversations || [];
  } catch (error) {
    markEndpointFailed('messages:conversations');
    throw new Error(error?.message || 'Failed to load conversations');
  }
};

export const getMessages = async (contactId) => {
  const cooldownKey = `messages:thread:${String(contactId || '')}`;
  if (isEndpointCoolingDown(cooldownKey)) {
    throw new Error('Messages are temporarily unavailable. Please try again in a minute.');
  }

  try {
    const data = await apiRequest(`/messages/${encodeURIComponent(contactId)}`);
    return data.messages || [];
  } catch (error) {
    markEndpointFailed(cooldownKey);
    throw new Error(error?.message || 'Failed to load messages');
  }
};

export const sendMessage = async (contactId, text) => {
  const data = await apiRequest(`/messages/${encodeURIComponent(contactId)}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  return data.message;
};
