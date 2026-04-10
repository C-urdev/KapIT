const expressApiBase = '/api';
const fastApiBase = '/fastapi';

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
