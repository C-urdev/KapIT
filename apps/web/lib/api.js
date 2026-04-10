const isProduction = process.env.NODE_ENV === 'production';

const expressApiBase = (
  process.env.EXPRESS_API_URL ||
  process.env.NEXT_PUBLIC_EXPRESS_API_URL ||
  (!isProduction ? 'http://127.0.0.1:5001/api' : '')
).replace(/\/$/, '');

const fastApiBase = (
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  (!isProduction ? 'http://127.0.0.1:8000' : '')
).replace(/\/$/, '');

export async function expressFetch(path, options = {}) {
  if (!expressApiBase) {
    throw new Error('Express API base URL is not configured.');
  }

  const response = await fetch(`${expressApiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Express request failed: ${response.status}`);
  }

  return response.json();
}

export async function fastApiFetch(path, options = {}) {
  if (!fastApiBase) {
    throw new Error('FastAPI base URL is not configured.');
  }

  const response = await fetch(`${fastApiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`FastAPI request failed: ${response.status}`);
  }

  return response.json();
}
