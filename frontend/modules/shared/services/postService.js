import { authRequest } from './apiClient';

const VISIBILITY_ALIASES = {
  public: 'public',
  connections: 'connections',
  private: 'private',
  'only me': 'private',
  'onlyme': 'private',
  friends: 'connections',
  network: 'connections',
};

const normalizeVisibilityForApi = (value, fallback = 'private') => {
  const normalized = String(value || '').trim().toLowerCase();
  return VISIBILITY_ALIASES[normalized] || fallback;
};

const withOptionalImageUrl = (payload, imageUrl) => {
  const normalizedImageUrl = String(imageUrl || '').trim();
  if (!normalizedImageUrl) {
    return payload;
  }

  return {
    ...payload,
    imageUrl: normalizedImageUrl,
  };
};

export const listFeedPosts = async (options = {}) => {
  const limit = Number(options?.limit);
  const cursorCreatedAt = String(options?.cursorCreatedAt || '').trim();
  const cursorId = Number(options?.cursorId);

  const params = new URLSearchParams();
  if (Number.isInteger(limit) && limit > 0) {
    params.set('limit', String(limit));
  }
  if (cursorCreatedAt) {
    params.set('cursorCreatedAt', cursorCreatedAt);
  }
  if (Number.isInteger(cursorId) && cursorId > 0) {
    params.set('cursorId', String(cursorId));
  }

  const query = params.toString();
  const data = await authRequest(`/posts/feed${query ? `?${query}` : ''}`);
  const posts = Array.isArray(data?.posts) ? data.posts : [];

  if (!params.has('limit') && !params.has('cursorCreatedAt') && !params.has('cursorId')) {
    return posts;
  }

  return {
    posts,
    hasMore: Boolean(data?.hasMore),
    nextCursor: data?.nextCursor && typeof data.nextCursor === 'object'
      ? {
          createdAt: String(data.nextCursor.createdAt || '').trim(),
          id: Number(data.nextCursor.id) || null,
        }
      : null,
  };
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
  const payload = withOptionalImageUrl(
    {
      content: String(content || '').trim(),
      visibility: normalizeVisibilityForApi(visibility),
    },
    imageUrl
  );

  const data = await authRequest('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
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
  const rawParentCommentId = typeof commentInput === 'object' ? commentInput?.parentCommentId : null;
  const parsedParentCommentId = Number(rawParentCommentId);
  const payload = withOptionalImageUrl({
    content: String(content || '').trim(),
    ...(Number.isInteger(parsedParentCommentId) && parsedParentCommentId > 0
      ? { parentCommentId: parsedParentCommentId }
      : {}),
  }, imageUrl);

  const data = await authRequest(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
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
      visibility: normalizeVisibilityForApi(shareInput?.visibility),
    }),
  });

  return data?.post || null;
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
