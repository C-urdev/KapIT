const VITE_API_BASE = process.env.VITE_API_BASE || '';
const VITE_API_URL = process.env.VITE_API_URL || '';
const VITE_CSRF_COOKIE_NAME = process.env.VITE_CSRF_COOKIE_NAME || '';
const CSRF_COOKIE_NAME_ENV = process.env.CSRF_COOKIE_NAME || '';
const NEXT_PUBLIC_EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || '';

const API_BASE = (VITE_API_BASE || NEXT_PUBLIC_EXPRESS_API_URL || '/api').replace(/\/$/, '');
const AUTH_BASE = (VITE_API_URL || `${API_BASE}/auth`).replace(/\/$/, '');
const CSRF_COOKIE_NAME = VITE_CSRF_COOKIE_NAME || CSRF_COOKIE_NAME_ENV || 'kapit_csrf_token';

let refreshRequest = null;

const getContentType = (response) => response.headers.get('content-type') || '';

const readCookie = (name) => {
  if (typeof document === 'undefined') {
    return '';
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const value = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(encodedName))
    ?.slice(encodedName.length);

  return value ? decodeURIComponent(value) : '';
};

const getCsrfToken = () => readCookie(CSRF_COOKIE_NAME);

const safeParseResponse = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  if (getContentType(response).includes('application/json')) {
    try {
      return JSON.parse(rawText);
    } catch {
      return {};
    }
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const shouldAttachCsrf = (method) => !['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase());

const buildHeaders = (method, headers = {}) => {
  const nextHeaders = {
    ...headers,
  };

  if (!nextHeaders['Content-Type'] && !nextHeaders['content-type'] && shouldAttachCsrf(method)) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  if (shouldAttachCsrf(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      nextHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  return nextHeaders;
};

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders('POST'),
    })
      .then(async (response) => {
        const data = await safeParseResponse(response);
        if (!response.ok) {
          throw new Error(data?.message || 'Unable to refresh session');
        }
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

export const apiRequest = async (path, options = {}) => {
  const {
    baseUrl = API_BASE,
    headers,
    retryOnUnauthorized = true,
    ...rest
  } = options;
  const method = String(rest.method || 'GET').toUpperCase();
  const normalizedPath = String(path || '');
  const resolvedPath =
    /^https?:\/\//i.test(normalizedPath)
      ? normalizedPath
      : normalizedPath.startsWith('/api')
        ? `${API_BASE}${normalizedPath.slice(4)}`
        : `${baseUrl}${normalizedPath}`;

  const response = await fetch(resolvedPath, {
    credentials: 'include',
    ...rest,
    method,
    headers: buildHeaders(method, headers),
  });

  const data = await safeParseResponse(response);
  if (response.status === 401 && retryOnUnauthorized) {
    await refreshSession();
    return apiRequest(path, {
      ...options,
      retryOnUnauthorized: false,
    });
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const authRequest = (path, options = {}) =>
  apiRequest(path, {
    baseUrl: AUTH_BASE,
    ...options,
  });

export const getSessionSnapshot = () => ({
  csrfToken: getCsrfToken(),
  apiBase: API_BASE,
  authBase: AUTH_BASE,
});
