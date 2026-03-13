const STORAGE_KEY = 'kapit_posts_by_user';

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getUserKey = (user) => {
  const email = user?.email?.trim().toLowerCase();
  if (email) {
    return email;
  }
  const fallback = user?.username || user?.name;
  return fallback ? String(fallback).trim().toLowerCase() : 'anonymous';
};

export const getPostsForUser = (user) => {
  const store = readStore();
  const key = getUserKey(user);
  return Array.isArray(store[key]) ? store[key] : [];
};

export const addPostForUser = (user, postInput) => {
  const store = readStore();
  const key = getUserKey(user);
  const current = Array.isArray(store[key]) ? store[key] : [];

  const newPost = {
    id: Date.now(),
    content: postInput.content,
    visibility: postInput.visibility || 'Only me',
    createdAt: new Date().toISOString(),
  };

  const next = [newPost, ...current];
  store[key] = next;
  writeStore(store);
  return next;
};
