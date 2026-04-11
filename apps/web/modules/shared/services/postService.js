import { authRequest } from './apiClient';

const LEGACY_STORAGE_KEY = 'kapit_posts_shared';
const LEGACY_STORAGE_KEY_V1 = 'kapit_posts_by_user';
const LEGACY_ACTIVITY_KEY = 'kapit_user_activity_by_user';

const readLegacyLocalPosts = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore malformed storage
  }

  try {
    const rawLegacy = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (!rawLegacy) {
      return [];
    }
    const parsed = JSON.parse(rawLegacy);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [];
    }
    return Object.entries(parsed).flatMap(([ownerKey, posts]) => (
      Array.isArray(posts)
        ? posts.map((post) => ({
            ...post,
            ownerKey,
            ownerName: post?.ownerName || 'User',
          }))
        : []
    ));
  } catch {
    return [];
  }
};

export const listFeedPosts = async () => {
  const data = await authRequest('/posts/feed');
  return Array.isArray(data?.posts) ? data.posts : [];
};

export const listMyPosts = async () => {
  const data = await authRequest('/posts/me');
  return Array.isArray(data?.posts) ? data.posts : [];
};

export const listProfilePosts = async (userId) => {
  const data = await authRequest(`/posts/profile/${encodeURIComponent(userId)}`);
  return Array.isArray(data?.posts) ? data.posts : [];
};

export const createPost = async ({ content, imageUrl, visibility }) => {
  const data = await authRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({
      content: String(content || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      visibility: String(visibility || 'Only me').trim() || 'Only me',
    }),
  });

  return data?.post || null;
};

export const deletePost = async (postId) => {
  const data = await authRequest(`/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });

  return Boolean(data?.deleted);
};

export const reactToPost = async (postId, reactionType) => {
  const data = await authRequest(`/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({
      reactionType: String(reactionType || '').trim().toLowerCase(),
    }),
  });

  return data?.post || null;
};

export const addCommentToPost = async (postId, commentInput) => {
  const content = typeof commentInput === 'string' ? commentInput : commentInput?.content;
  const imageUrl = typeof commentInput === 'string' ? '' : commentInput?.imageUrl;
  const parentCommentId = typeof commentInput === 'object' ? commentInput?.parentCommentId : null;

  const data = await authRequest(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      content: String(content || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      parentCommentId: parentCommentId ? Number(parentCommentId) : null,
    }),
  });

  return data?.post || null;
};

export const reactToCommentOnPost = async (postId, commentId, reactionType, parentCommentId = null) => {
  const data = await authRequest(
    `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({
        reactionType: String(reactionType || '').trim().toLowerCase(),
        parentCommentId: parentCommentId ? Number(parentCommentId) : null,
      }),
    }
  );

  return data?.post || null;
};

export const toggleSharePost = async (postId, shareInput = {}) => {
  const data = await authRequest(`/posts/${encodeURIComponent(postId)}/share`, {
    method: 'POST',
    body: JSON.stringify({
      message: String(shareInput?.message || '').trim(),
      visibility: String(shareInput?.visibility || 'Only me').trim() || 'Only me',
    }),
  });

  return data?.post || null;
};

export const importLegacyLocalPosts = async () => {
  const posts = readLegacyLocalPosts();
  if (!posts.length) {
    return { importedCount: 0, skippedCount: 0 };
  }

  const data = await authRequest('/posts/import-local', {
    method: 'POST',
    body: JSON.stringify({ posts }),
  });

  return {
    importedCount: Number(data?.importedCount || 0),
    skippedCount: Number(data?.skippedCount || 0),
  };
};

export const listSavedPosts = async () => {
  const data = await authRequest('/saved-posts');
  return Array.isArray(data?.savedPosts) ? data.savedPosts : [];
};

export const savePost = async (postId) => {
  const data = await authRequest('/saved-posts', {
    method: 'POST',
    body: JSON.stringify({ postId: Number(postId) }),
  });
  return Boolean(data?.saved);
};

export const removeSavedPost = async (postId) => {
  const data = await authRequest(`/saved-posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
  return Boolean(data?.removed);
};

const readLegacySavedPosts = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_ACTIVITY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const values = Object.values(parsed);
    return values.flatMap((entry) => (Array.isArray(entry?.savedPosts) ? entry.savedPosts : []));
  } catch {
    return [];
  }
};

export const importLegacySavedPosts = async () => {
  const savedPosts = readLegacySavedPosts();
  if (!savedPosts.length) {
    return { importedCount: 0, skippedCount: 0 };
  }

  const data = await authRequest('/saved-posts/import-local', {
    method: 'POST',
    body: JSON.stringify({ savedPosts }),
  });

  return {
    importedCount: Number(data?.importedCount || 0),
    skippedCount: Number(data?.skippedCount || 0),
  };
};
