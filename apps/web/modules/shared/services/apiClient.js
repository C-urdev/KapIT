const NEXT_PUBLIC_EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || '';
const NEXT_PUBLIC_FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || '';
const NEXT_PUBLIC_CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || '';

const API_BASE = (
  typeof window !== 'undefined'
    ? '/api'
    : (NEXT_PUBLIC_EXPRESS_API_URL || '/api')
).replace(/\/$/, '');
const AUTH_BASE = `${API_BASE}/auth`;
const FASTAPI_BASE = (NEXT_PUBLIC_FASTAPI_URL || '').replace(/\/$/, '');
const CSRF_COOKIE_NAME = NEXT_PUBLIC_CSRF_COOKIE_NAME || 'kapit_csrf_token';

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

const isHtmlDocument = (value) => /<!doctype html>|<html[\s>]/i.test(String(value || ''));

const getResponseErrorMessage = ({ response, data, resolvedPath }) => {
  if (String(data?.error || '').trim().toLowerCase() === 'validation error') {
    const firstDetail = Array.isArray(data?.details) ? data.details[0] : null;
    const detailPath = String(firstDetail?.path || '').trim();
    const detailMessage = String(firstDetail?.message || '').trim();
    if (detailPath || detailMessage) {
      return `Validation error${detailPath ? ` at "${detailPath}"` : ''}${detailMessage ? `: ${detailMessage}` : ''}`;
    }
  }

  const message = String(data?.message || data?.error || '').trim();
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('router_external_target_error')) {
    return 'The deployed API proxy could not reach the backend service. Please retry, and verify NEXT_PUBLIC_EXPRESS_API_URL/EXPRESS_API_URL point to a live HTTPS API.';
  }

  if (response.status === 500 && normalizedMessage === 'internal server error') {
    return 'The API restarted while processing your request. Please retry in a moment.';
  }

  if (isHtmlDocument(message)) {
    if (response.status === 404) {
      return `Request failed: ${resolvedPath} was not found. Check your deployed API URL configuration.`;
    }

    return 'Request failed because the server returned an unexpected HTML page instead of API JSON.';
  }

  if (response.status === 404) {
    return `Request failed: ${resolvedPath} was not found.`;
  }

  return message || 'Request failed';
};

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
const waitFor = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

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
    retryOnRouterExternalError = true,
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

  let response;
  try {
    response = await fetch(resolvedPath, {
      credentials: 'include',
      ...rest,
      method,
      headers: buildHeaders(method, headers),
    });
  } catch (error) {
    const networkMessage = String(error?.message || '').toLowerCase();
    if (networkMessage.includes('econnreset') || networkMessage.includes('fetch failed')) {
      throw new Error('The API connection was reset while the server was restarting. Please retry.');
    }
    throw error;
  }

  const data = await safeParseResponse(response);
  if (response.status === 401 && retryOnUnauthorized) {
    await refreshSession();
    return apiRequest(path, {
      ...options,
      retryOnUnauthorized: false,
    });
  }

  if (!response.ok) {
    const routerErrorMessage = String(data?.message || data?.error || '').toLowerCase();
    if (
      retryOnRouterExternalError &&
      routerErrorMessage.includes('router_external_target_error')
    ) {
      await waitFor(1200);
      return apiRequest(path, {
        ...options,
        retryOnRouterExternalError: false,
      });
    }

    throw new Error(getResponseErrorMessage({ response, data, resolvedPath }));
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
  fastApiBase: FASTAPI_BASE,
});
