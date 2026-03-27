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

export const listConversations = async () => {
  if (isEndpointCoolingDown('messages:conversations')) {
    return [];
  }

  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/messages/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await safeJson(response);
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed('messages:conversations');
      return [];
    }
    throw new Error(getErrorMessage(data, 'Failed to load conversations'));
  }

  return data.conversations || [];
};

export const getMessages = async (contactId) => {
  const cooldownKey = `messages:thread:${String(contactId || '')}`;
  if (isEndpointCoolingDown(cooldownKey)) {
    return [];
  }

  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/messages/${encodeURIComponent(contactId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await safeJson(response);
  if (!response.ok) {
    if (isServerFailure(response)) {
      markEndpointFailed(cooldownKey);
      return [];
    }
    throw new Error(getErrorMessage(data, 'Failed to load messages'));
  }

  return data.messages || [];
};

export const sendMessage = async (contactId, text) => {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/messages/${encodeURIComponent(contactId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to send message'));
  }

  return data.message;
};



