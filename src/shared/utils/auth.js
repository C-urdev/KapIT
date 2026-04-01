import { getStoredUser, isAuthenticated, logoutUser } from '@sharedServices/authService';
import { getSessionSnapshot } from '@sharedServices/apiClient';

export const getToken = () => '';
export const setToken = () => {};
export const removeToken = () => {
  logoutUser();
};
export const isAuth = () => isAuthenticated();
export const getAuthHeader = () => {
  const session = getSessionSnapshot();
  const user = getStoredUser();

  if (!user) {
    return {};
  }

  return session.csrfToken ? { 'X-CSRF-Token': session.csrfToken } : {};
};
