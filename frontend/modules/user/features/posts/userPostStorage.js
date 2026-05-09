const STORAGE_KEY = 'kapit_posts_shared';
const LEGACY_STORAGE_KEY = 'kapit_posts_by_user';

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) {
        return [];
      }

      const legacyParsed = JSON.parse(legacyRaw);
      if (!legacyParsed || Array.isArray(legacyParsed) || typeof legacyParsed !== 'object') {
        return [];
      }

      const migrated = Object.entries(legacyParsed).flatMap(([ownerKey, posts]) => (
        Array.isArray(posts)
          ? posts.map((post) => ({
              ...post,
              ownerKey,
              ownerName: post?.ownerName || 'User',
            }))
          : []
      ));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStore = (posts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

const getUserKey = (user) => {
  const email = user?.email?.trim().toLowerCase();
  if (email) {
    return email;
  }
  const fallback = user?.fullName || user?.name || user?.username;
  return fallback ? String(fallback).trim().toLowerCase() : 'anonymous';
};

const getUserDisplayName = (user) =>
  user?.companyName ||
  user?.fullName ||
  user?.name ||
  user?.username ||
  user?.email ||
  'User';

const getPostOwnerDisplayName = (post) => {
  const ownerName = String(post?.ownerName || '').trim();
  if (ownerName && ownerName.toLowerCase() !== 'user') {
    return ownerName;
  }

  const ownerKey = String(post?.ownerKey || '').trim();
  if (ownerKey && ownerKey !== 'anonymous') {
    const fallbackName = ownerKey.includes('@') ? ownerKey.split('@')[0] : ownerKey;
    if (fallbackName) {
      return fallbackName;
    }
  }

  return 'User';
};

const normalizeComment = (comment) => ({
  ...comment,
  author: comment?.author || 'User',
  authorProfileImage: comment?.authorProfileImage || '',
  reactions: Array.isArray(comment?.reactions) ? comment.reactions : [],
  replies: Array.isArray(comment?.replies) ? comment.replies.map(normalizeComment) : [],
});

const normalizePost = (post) => ({
  ...post,
  ownerKey: post?.ownerKey || 'anonymous',
  ownerName: getPostOwnerDisplayName(post),
  ownerProfileImage: post?.ownerProfileImage || '',
  reactions: Array.isArray(post?.reactions) ? post.reactions : [],
  comments: Array.isArray(post?.comments) ? post.comments.map(normalizeComment) : [],
  shares: Array.isArray(post?.shares) ? post.shares : [],
});

const readNormalizedPosts = () => readStore().map(normalizePost);
const isPublicPost = (post) => String(post?.visibility || '').trim().toLowerCase() === 'public';

const updateSharedPost = (postId, updater) => {
  const current = readNormalizedPosts();
  const next = current.map((post) => {
    if (Number(post?.id) !== Number(postId)) {
      return post;
    }

    const updated = updater(post);
    return normalizePost(updated || post);
  });

  writeStore(next);
  return next;
};

export const getPostsForUser = (user, viewer = user) => {
  const ownerKey = getUserKey(user);
  const viewerKey = getUserKey(viewer);
  return readNormalizedPosts()
    .filter((post) => post.ownerKey === ownerKey)
    .filter((post) => ownerKey === viewerKey || isPublicPost(post));
};

export const getFeedPostsForViewer = (viewer) => {
  const viewerKey = getUserKey(viewer);
  return readNormalizedPosts()
    .filter((post) => post.ownerKey === viewerKey || isPublicPost(post))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

export const addPostForUser = (user, postInput) => {
  const ownerKey = getUserKey(user);
  const ownerName = getUserDisplayName(user);
  const current = readNormalizedPosts();

  const newPost = {
    id: Date.now(),
    ownerKey,
    ownerName,
    ownerProfileImage: user?.profileImage || '',
    content: postInput.content,
    imageUrl: String(postInput.imageUrl || '').trim(),
    visibility: postInput.visibility || 'Only me',
    createdAt: new Date().toISOString(),
    reactions: [],
    comments: [],
    shares: [],
  };

  const next = [newPost, ...current];
  writeStore(next);
  return next.filter((post) => post.ownerKey === ownerKey);
};

export const deletePostForUser = (user, postId) => {
  const ownerKey = getUserKey(user);
  const next = readNormalizedPosts().filter((post) => !(Number(post?.id) === Number(postId) && post.ownerKey === ownerKey));
  writeStore(next);
  return next.filter((post) => post.ownerKey === ownerKey);
};

export const updatePostForUser = (user, postId, updater) => {
  const ownerKey = getUserKey(user);
  const next = updateSharedPost(postId, updater);
  return next.filter((post) => post.ownerKey === ownerKey);
};

export const reactToPostForUser = (user, postId, reactionType) => {
  const actorKey = getUserKey(user);
  const normalizedReaction = String(reactionType || '').trim().toLowerCase();

  return updatePostForUser(user, postId, (post) => {
    const currentReactions = Array.isArray(post.reactions) ? post.reactions : [];
    const existingReaction = currentReactions.find((entry) => entry.userKey === actorKey);

    if (!normalizedReaction) {
      return {
        ...post,
        reactions: currentReactions.filter((entry) => entry.userKey !== actorKey),
      };
    }

    const nextReaction = {
      userKey: actorKey,
      type: normalizedReaction,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...post,
      reactions: existingReaction
        ? currentReactions.map((entry) => (entry.userKey === actorKey ? nextReaction : entry))
        : [...currentReactions, nextReaction],
    };
  });
};

export const addCommentToPostForUser = (user, postId, commentInput) => {
  const actorKey = getUserKey(user);
  const actorName = getUserDisplayName(user);
  const parentCommentId = Number(commentInput?.parentCommentId || 0);
  const content = typeof commentInput === 'string' ? commentInput : commentInput?.content;
  const imageUrl = typeof commentInput === 'string' ? '' : String(commentInput?.imageUrl || '').trim();
  const trimmed = String(content || '').trim();
  if (!trimmed && !imageUrl) {
    return getPostsForUser(user);
  }

  const nextComment = normalizeComment({
    id: Date.now(),
    userKey: actorKey,
    author: actorName,
    authorProfileImage: user?.profileImage || '',
    content: trimmed,
    imageUrl,
    reactions: [],
    replies: [],
    createdAt: new Date().toISOString(),
  });

  return updatePostForUser(user, postId, (post) => {
    const currentComments = Array.isArray(post.comments) ? post.comments.map(normalizeComment) : [];

    if (!parentCommentId) {
      return {
        ...post,
        comments: [nextComment, ...currentComments],
      };
    }

    return {
      ...post,
      comments: currentComments.map((comment) => (
        Number(comment.id) === parentCommentId
          ? {
              ...comment,
              replies: [...(Array.isArray(comment.replies) ? comment.replies.map(normalizeComment) : []), nextComment],
            }
          : comment
      )),
    };
  });
};

export const reactToCommentOnPostForUser = (user, postId, commentId, reactionType, parentCommentId = null) => {
  const actorKey = getUserKey(user);
  const normalizedReaction = String(reactionType || '').trim().toLowerCase();
  const targetCommentId = Number(commentId);
  const targetParentId = parentCommentId ? Number(parentCommentId) : null;

  const toggleReactions = (items) => items.map((entry) => {
    const isTarget = Number(entry.id) === targetCommentId;
    if (!isTarget) {
      return entry;
    }

    const currentReactions = Array.isArray(entry.reactions) ? entry.reactions : [];
    if (!normalizedReaction) {
      return {
        ...entry,
        reactions: currentReactions.filter((reaction) => reaction.userKey !== actorKey),
      };
    }

    const nextReaction = {
      userKey: actorKey,
      type: normalizedReaction,
      updatedAt: new Date().toISOString(),
    };

    const existingReaction = currentReactions.find((reaction) => reaction.userKey === actorKey);
    return {
      ...entry,
      reactions: existingReaction
        ? currentReactions.map((reaction) => (reaction.userKey === actorKey ? nextReaction : reaction))
        : [...currentReactions, nextReaction],
    };
  });

  return updatePostForUser(user, postId, (post) => {
    const currentComments = Array.isArray(post.comments) ? post.comments.map(normalizeComment) : [];
    return {
      ...post,
      comments: currentComments.map((comment) => {
        if (targetParentId && Number(comment.id) === targetParentId) {
          return {
            ...comment,
            replies: toggleReactions(Array.isArray(comment.replies) ? comment.replies : []),
          };
        }

        if (!targetParentId && Number(comment.id) === targetCommentId) {
          return toggleReactions([comment])[0];
        }

        return comment;
      }),
    };
  });
};

export const toggleSharePostForUser = (user, postId, shareInput = {}) => {
  const actorKey = getUserKey(user);
  const actorName = getUserDisplayName(user);
  const visibility = String(shareInput?.visibility || 'Only me').trim() || 'Only me';
  const message = String(shareInput?.message || '').trim();
  const current = readNormalizedPosts();
  const sourcePost = current.find((post) => Number(post?.id) === Number(postId));
  if (!sourcePost) {
    return getPostsForUser(user);
  }

  const currentShares = Array.isArray(sourcePost.shares) ? sourcePost.shares : [];
  const alreadyShared = currentShares.some((entry) => entry.userKey === actorKey);
  const timestamp = new Date().toISOString();

  const updatedPosts = current
    .map((post) => {
      if (Number(post?.id) !== Number(postId)) {
        return post;
      }

      return normalizePost({
        ...post,
        shares: alreadyShared
          ? currentShares.filter((entry) => entry.userKey !== actorKey)
          : [
              {
                userKey: actorKey,
                visibility,
                message,
                createdAt: timestamp,
              },
              ...currentShares,
            ],
      });
    })
    .filter((post) => !(post?.sharedPostId && Number(post.sharedPostId) === Number(postId) && post.ownerKey === actorKey));

  if (!alreadyShared) {
    updatedPosts.unshift(normalizePost({
      id: Number(`${Date.now()}${String(postId).slice(-4)}`),
      ownerKey: actorKey,
      ownerName: actorName,
      ownerProfileImage: user?.profileImage || '',
      content: message,
      imageUrl: '',
      visibility,
      createdAt: timestamp,
      reactions: [],
      comments: [],
      shares: [],
      sharedPostId: sourcePost.id,
      sharedPost: {
        ownerKey: sourcePost.ownerKey,
        ownerName: sourcePost.ownerName,
        ownerProfileImage: sourcePost.ownerProfileImage || '',
        content: sourcePost.content,
        imageUrl: sourcePost.imageUrl,
        visibility: sourcePost.visibility,
        createdAt: sourcePost.createdAt,
      },
    }));
  }

  writeStore(updatedPosts);
  return getPostsForUser(user);
};
