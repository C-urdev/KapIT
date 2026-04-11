const expressApiBase =
  process.env.EXPRESS_API_URL ||
  process.env.NEXT_PUBLIC_EXPRESS_API_URL ||
  'http://127.0.0.1:5001/api';
const fastApiBase =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  'http://127.0.0.1:8000';

export async function expressFetch(path, options = {}) {
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
