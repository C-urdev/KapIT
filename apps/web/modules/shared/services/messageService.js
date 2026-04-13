import { apiRequest } from './apiClient';

export const listConversations = async () => {
  try {
    const data = await apiRequest('/messages/conversations');
    return data.conversations || [];
  } catch (error) {
    throw new Error(error?.message || 'Failed to load conversations');
  }
};

export const getMessages = async (contactId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.beforeCreatedAt) {
      params.set('beforeCreatedAt', String(options.beforeCreatedAt));
    }
    if (options.limit) {
      params.set('limit', String(options.limit));
    }
    if (options.recentHours) {
      params.set('recentHours', String(options.recentHours));
    }

    const query = params.toString();
    const data = await apiRequest(`/messages/${encodeURIComponent(contactId)}${query ? `?${query}` : ''}`);
    return {
      messages: data.messages || [],
      hasMore: Boolean(data.hasMore),
    };
  } catch (error) {
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
