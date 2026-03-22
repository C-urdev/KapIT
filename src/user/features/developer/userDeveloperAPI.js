const API_BASE = '/api/developer';

const getToken = () => localStorage.getItem('token');

const request = async (path, { method = 'GET', body } = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
};

export const developerAPI = {
  saveProfile: (profileInput) => request('/profile', { method: 'PUT', body: profileInput }),
  getMyProfile: () => request('/profile'),
};

export const saveDeveloperProfile = (profileInput) => developerAPI.saveProfile(profileInput);




