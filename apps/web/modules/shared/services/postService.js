import { authRequest } from './apiClient';

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
