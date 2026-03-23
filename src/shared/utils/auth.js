// Get token from sessionStorage
export const getToken = () => {
  return sessionStorage.getItem('token');
};

// Set token in sessionStorage
export const setToken = (token) => {
  sessionStorage.setItem('token', token);
};

// Remove token from sessionStorage
export const removeToken = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuth = () => {
  const token = getToken();
  return !!token;
};

// Get Authorization header
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};


