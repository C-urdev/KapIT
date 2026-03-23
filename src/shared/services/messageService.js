const API_URL = import.meta.env.VITE_API_BASE || '/api';

const getToken = () => sessionStorage.getItem('token');

const getErrorMessage = (data, fallback) => data?.message || fallback;

export const listConversations = async () => {
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load conversations'));
  }

  return data.conversations || [];
};

export const getMessages = async (contactId) => {
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

  const data = await response.json();
  if (!response.ok) {
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



