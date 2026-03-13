// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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