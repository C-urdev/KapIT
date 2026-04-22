const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const { logger } = require('../config/logger');

let postsTableReady = false;
let postsTablePromise = null;
let savedPostsTableReady = false;
let savedPostsTablePromise = null;

const ensurePostsTable = async (client) => {
  if (postsTableReady) {
    return;
  }

  if (!postsTablePromise) {
    postsTablePromise = (async () => {
      const db = client || (await pool.connect());

      try {
        await ensureOnboardingSchemaReady();
        await db.query(`
          CREATE TABLE IF NOT EXISTS user_posts (
            id BIGSERIAL PRIMARY KEY,
            owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL DEFAULT '',
            image_url TEXT NOT NULL DEFAULT '',
            visibility VARCHAR(20) NOT NULL DEFAULT 'Only me',
            reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
            comments JSONB NOT NULL DEFAULT '[]'::jsonb,
            shares JSONB NOT NULL DEFAULT '[]'::jsonb,
            shared_post_id BIGINT REFERENCES user_posts(id) ON DELETE SET NULL,
            shared_post JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_user_posts_owner_created
          ON user_posts(owner_user_id, created_at DESC)
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_user_posts_visibility_created
          ON user_posts(visibility, created_at DESC)
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_user_posts_shared_post_id
          ON user_posts(shared_post_id)
        `);

        postsTableReady = true;
      } finally {
        if (!client) {
          db.release();
        }
      }
    })().catch((error) => {
      postsTablePromise = null;
      postsTableReady = false;
      throw error;
    });
  }

  await postsTablePromise;
};

const ensureSavedPostsTable = async (client) => {
  if (savedPostsTableReady) {
    return;
  }

  if (!savedPostsTablePromise) {
    savedPostsTablePromise = (async () => {
      const db = client || (await pool.connect());

      try {
        await ensurePostsTable(db);
        await db.query(`
          CREATE TABLE IF NOT EXISTS user_saved_posts (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            post_id BIGINT NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (user_id, post_id)
          )
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_created
          ON user_saved_posts(user_id, created_at DESC)
        `);

        savedPostsTableReady = true;
      } finally {
        if (!client) {
          db.release();
        }
      }
    })().catch((error) => {
      savedPostsTablePromise = null;
      savedPostsTableReady = false;
      throw error;
    });
  }

  await savedPostsTablePromise;
};

const parseJsonArray = (value) => (Array.isArray(value) ? value : []);

const normalizeVisibility = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'public') {
    return 'Public';
  }
  return 'Only me';
};

/** SQL predicate: true when stored visibility is public (any casing), matching {@link normalizeVisibility}. */
const sqlPostIsPublic = "LOWER(TRIM(COALESCE(p.visibility, ''))) = 'public'";

const getUserKey = (userLike) => {
  const email = String(userLike?.email || '').trim().toLowerCase();
  if (email) {
    return email;
  }

  const fallback = String(userLike?.username || userLike?.name || '').trim().toLowerCase();
  return fallback || 'anonymous';
};

const getDisplayName = (userLike) =>
  userLike?.company_name ||
  userLike?.companyName ||
  userLike?.full_name ||
  userLike?.name ||
  userLike?.username ||
  userLike?.email ||
  'User';

const getPostOwnerDisplayName = (post) => {
  const ownerName = String(post?.ownerName || '').trim();
  if (ownerName && ownerName.toLowerCase() !== 'user') {
    return ownerName;
  }

  const ownerKey = String(post?.ownerKey || '').trim();
  if (ownerKey && ownerKey !== 'anonymous') {
    return ownerKey.includes('@') ? ownerKey.split('@')[0] : ownerKey;
  }

  return 'User';
};

const normalizeComment = (comment) => ({
  ...comment,
  author: comment?.author || 'User',
  authorProfileImage: comment?.authorProfileImage || '',
  reactions: parseJsonArray(comment?.reactions),
  replies: parseJsonArray(comment?.replies).map(normalizeComment),
});

const toPostDto = (row) => {
  const owner = {
    email: row.owner_email,
    username: row.owner_username,
    full_name: row.owner_full_name,
    name: row.owner_name,
    company_name: row.owner_company_name,
  };

  const ownerKey = getUserKey(owner);
  const ownerName = getDisplayName(owner);

  return {
    id: Number(row.id),
    ownerUserId: row.owner_user_id,
    ownerKey,
    ownerName,
    ownerProfileImage: row.owner_profile_image || '',
    content: row.content || '',
    imageUrl: row.image_url || '',
    visibility: normalizeVisibility(row.visibility),
    createdAt: row.created_at,
    reactions: parseJsonArray(row.reactions),
    comments: parseJsonArray(row.comments).map(normalizeComment),
    shares: parseJsonArray(row.shares),
    sharedPostId: row.shared_post_id ? Number(row.shared_post_id) : null,
    sharedPost: row.shared_post && typeof row.shared_post === 'object' && Object.keys(row.shared_post).length ? row.shared_post : null,
  };
};

const readPostWithOwner = async (client, postId) => {
  const result = await client.query(
    `SELECT p.*,
            u.email AS owner_email,
            u.username AS owner_username,
            dp.full_name AS owner_full_name,
            u.name AS owner_name,
            u.company_name AS owner_company_name,
            u.profile_image AS owner_profile_image
     FROM user_posts p
     JOIN users u ON u.id = p.owner_user_id
     LEFT JOIN developer_profiles dp ON dp.user_id = u.id
     WHERE p.id = $1
     LIMIT 1`,
    [postId]
  );

  return result.rows[0] || null;
};

const canViewerAccessPost = (postRow, viewerUserId) =>
  Boolean(
    postRow &&
      (String(postRow.owner_user_id) === String(viewerUserId) || normalizeVisibility(postRow.visibility) === 'Public')
  );

const listFeedPosts = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const result = await client.query(
      `SELECT p.*,
              u.email AS owner_email,
              u.username AS owner_username,
              dp.full_name AS owner_full_name,
              u.name AS owner_name,
              u.company_name AS owner_company_name,
              u.profile_image AS owner_profile_image
       FROM user_posts p
       JOIN users u ON u.id = p.owner_user_id
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE p.owner_user_id = $1
          OR ${sqlPostIsPublic}
       ORDER BY p.created_at DESC, p.id DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      posts: result.rows.map(toPostDto),
    });
  } catch (error) {
    logger.error('List feed posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load feed posts.',
    });
  } finally {
    client?.release();
  }
};

const listMyPosts = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const result = await client.query(
      `SELECT p.*,
              u.email AS owner_email,
              u.username AS owner_username,
              dp.full_name AS owner_full_name,
              u.name AS owner_name,
              u.company_name AS owner_company_name,
              u.profile_image AS owner_profile_image
       FROM user_posts p
       JOIN users u ON u.id = p.owner_user_id
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE p.owner_user_id = $1
       ORDER BY p.created_at DESC, p.id DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      posts: result.rows.map(toPostDto),
    });
  } catch (error) {
    logger.error('List my posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load your posts.',
    });
  } finally {
    client?.release();
  }
};

const listProfilePosts = async (req, res) => {
  let client;

  try {
    const profileUserId = String(req.params.userId || '').trim();
    if (!profileUserId) {
      return res.status(400).json({ success: false, message: 'Profile user id is required.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const includePrivate = profileUserId === req.user.id;
    const result = await client.query(
      `SELECT p.*,
              u.email AS owner_email,
              u.username AS owner_username,
              dp.full_name AS owner_full_name,
              u.name AS owner_name,
              u.company_name AS owner_company_name,
              u.profile_image AS owner_profile_image
       FROM user_posts p
       JOIN users u ON u.id = p.owner_user_id
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE p.owner_user_id = $1
         AND ($2::boolean = TRUE OR ${sqlPostIsPublic})
       ORDER BY p.created_at DESC, p.id DESC`,
      [profileUserId, includePrivate]
    );

    return res.json({
      success: true,
      posts: result.rows.map(toPostDto),
    });
  } catch (error) {
    logger.error('List profile posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load profile posts.',
    });
  } finally {
    client?.release();
  }
};

const createPost = async (req, res) => {
  let client;

  try {
    const content = String(req.body?.content || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const visibility = normalizeVisibility(req.body?.visibility);

    if (!content && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post content or image is required.',
      });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const result = await client.query(
      `INSERT INTO user_posts (owner_user_id, content, image_url, visibility)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.user.id, content, imageUrl, visibility]
    );

    const postRow = await readPostWithOwner(client, result.rows[0].id);
    return res.status(201).json({
      success: true,
      post: toPostDto(postRow),
    });
  } catch (error) {
    logger.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create post.',
    });
  } finally {
    client?.release();
  }
};

const deletePost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const result = await client.query(
      `DELETE FROM user_posts
       WHERE id = $1
         AND owner_user_id = $2`,
      [postId, req.user.id]
    );

    return res.json({
      success: true,
      deleted: result.rowCount > 0,
    });
  } catch (error) {
    logger.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete post.',
    });
  } finally {
    client?.release();
  }
};

const reactToPost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    const reactionType = String(req.body?.reactionType || '').trim().toLowerCase();
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const postRow = await readPostWithOwner(client, postId);
    if (!postRow || !canViewerAccessPost(postRow, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const actorKey = getUserKey(req.user);
    const reactions = parseJsonArray(postRow.reactions);
    const existingIndex = reactions.findIndex((entry) => entry?.userKey === actorKey);

    if (!reactionType) {
      if (existingIndex >= 0) {
        reactions.splice(existingIndex, 1);
      }
    } else {
      const nextReaction = {
        userKey: actorKey,
        type: reactionType,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        reactions[existingIndex] = nextReaction;
      } else {
        reactions.push(nextReaction);
      }
    }

    await client.query(
      `UPDATE user_posts
       SET reactions = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [postId, JSON.stringify(reactions)]
    );

    const refreshed = await readPostWithOwner(client, postId);
    return res.json({ success: true, post: toPostDto(refreshed) });
  } catch (error) {
    logger.error('React to post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update post reaction.',
    });
  } finally {
    client?.release();
  }
};

const addCommentToPost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    const parentCommentId = Number(req.body?.parentCommentId || 0);
    const content = String(req.body?.content || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Comment content or image is required.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const actorResult = await client.query(
      `SELECT u.id, u.email, u.username, dp.full_name, u.name, u.company_name, u.profile_image
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    const actor = actorResult.rows[0];
    if (!actor) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const postRow = await readPostWithOwner(client, postId);
    if (!postRow || !canViewerAccessPost(postRow, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comments = parseJsonArray(postRow.comments).map(normalizeComment);
    const nextComment = normalizeComment({
      id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
      userKey: getUserKey(actor),
      author: getDisplayName(actor),
      authorProfileImage: actor.profile_image || '',
      content,
      imageUrl,
      reactions: [],
      replies: [],
      createdAt: new Date().toISOString(),
    });

    if (!parentCommentId) {
      comments.unshift(nextComment);
    } else {
      for (let index = 0; index < comments.length; index += 1) {
        if (Number(comments[index].id) === parentCommentId) {
          comments[index] = {
            ...comments[index],
            replies: [...parseJsonArray(comments[index].replies), nextComment],
          };
          break;
        }
      }
    }

    await client.query(
      `UPDATE user_posts
       SET comments = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [postId, JSON.stringify(comments)]
    );

    const refreshed = await readPostWithOwner(client, postId);
    return res.json({ success: true, post: toPostDto(refreshed) });
  } catch (error) {
    logger.error('Add comment to post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment.',
    });
  } finally {
    client?.release();
  }
};

const reactToCommentOnPost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    const commentId = Number(req.params.commentId);
    const parentCommentId = req.body?.parentCommentId ? Number(req.body.parentCommentId) : null;
    const reactionType = String(req.body?.reactionType || '').trim().toLowerCase();

    if (!Number.isInteger(postId) || postId <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post/comment id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);

    const postRow = await readPostWithOwner(client, postId);
    if (!postRow || !canViewerAccessPost(postRow, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const actorKey = getUserKey(req.user);
    const comments = parseJsonArray(postRow.comments).map(normalizeComment);

    const toggleReactions = (target) => {
      const reactions = parseJsonArray(target.reactions);
      const existingIndex = reactions.findIndex((entry) => entry?.userKey === actorKey);

      if (!reactionType) {
        if (existingIndex >= 0) {
          reactions.splice(existingIndex, 1);
        }
      } else {
        const nextReaction = {
          userKey: actorKey,
          type: reactionType,
          updatedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          reactions[existingIndex] = nextReaction;
        } else {
          reactions.push(nextReaction);
        }
      }

      return {
        ...target,
        reactions,
      };
    };

    for (let index = 0; index < comments.length; index += 1) {
      const comment = comments[index];

      if (parentCommentId && Number(comment.id) === parentCommentId) {
        comments[index] = {
          ...comment,
          replies: parseJsonArray(comment.replies).map((reply) => (
            Number(reply.id) === commentId ? toggleReactions(reply) : reply
          )),
        };
        break;
      }

      if (!parentCommentId && Number(comment.id) === commentId) {
        comments[index] = toggleReactions(comment);
        break;
      }
    }

    await client.query(
      `UPDATE user_posts
       SET comments = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [postId, JSON.stringify(comments)]
    );

    const refreshed = await readPostWithOwner(client, postId);
    return res.json({ success: true, post: toPostDto(refreshed) });
  } catch (error) {
    logger.error('React to comment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment reaction.',
    });
  } finally {
    client?.release();
  }
};

const toggleSharePost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    const visibility = normalizeVisibility(req.body?.visibility);
    const message = String(req.body?.message || '').trim();

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensurePostsTable(client);
    await client.query('BEGIN');

    const sourcePost = await readPostWithOwner(client, postId);
    if (!sourcePost || !canViewerAccessPost(sourcePost, req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const actorResult = await client.query(
      `SELECT u.id, u.email, u.username, dp.full_name, u.name, u.company_name, u.profile_image
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const actor = actorResult.rows[0];

    if (!actor) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const actorKey = getUserKey(actor);
    const shares = parseJsonArray(sourcePost.shares);
    const alreadyShared = shares.some((entry) => entry?.userKey === actorKey);
    const timestamp = new Date().toISOString();

    const nextShares = alreadyShared
      ? shares.filter((entry) => entry?.userKey !== actorKey)
      : [
          {
            userKey: actorKey,
            visibility,
            message,
            createdAt: timestamp,
          },
          ...shares,
        ];

    await client.query(
      `UPDATE user_posts
       SET shares = $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [postId, JSON.stringify(nextShares)]
    );

    await client.query(
      `DELETE FROM user_posts
       WHERE owner_user_id = $1
         AND shared_post_id = $2`,
      [req.user.id, postId]
    );

    if (!alreadyShared) {
      const sharedSnapshot = {
        ownerKey: getUserKey({
          email: sourcePost.owner_email,
          username: sourcePost.owner_username,
          full_name: sourcePost.owner_full_name,
          name: sourcePost.owner_name,
          company_name: sourcePost.owner_company_name,
        }),
        ownerName: getPostOwnerDisplayName({
          ownerName: getDisplayName({
            email: sourcePost.owner_email,
            username: sourcePost.owner_username,
            full_name: sourcePost.owner_full_name,
            name: sourcePost.owner_name,
            company_name: sourcePost.owner_company_name,
          }),
        }),
        ownerProfileImage: sourcePost.owner_profile_image || '',
        content: sourcePost.content || '',
        imageUrl: sourcePost.image_url || '',
        visibility: normalizeVisibility(sourcePost.visibility),
        createdAt: sourcePost.created_at,
      };

      await client.query(
        `INSERT INTO user_posts (
           owner_user_id,
           content,
           image_url,
           visibility,
           shared_post_id,
           shared_post
         )
         VALUES ($1, $2, '', $3, $4, $5::jsonb)`,
        [req.user.id, message, visibility, postId, JSON.stringify(sharedSnapshot)]
      );
    }

    await client.query('COMMIT');
    const refreshed = await readPostWithOwner(client, postId);
    return res.json({ success: true, post: toPostDto(refreshed) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Toggle share post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update shared post.',
    });
  } finally {
    client?.release();
  }
};

const listSavedPosts = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureSavedPostsTable(client);

    const result = await client.query(
      `SELECT p.*,
              u.email AS owner_email,
              u.username AS owner_username,
              dp.full_name AS owner_full_name,
              u.name AS owner_name,
              u.company_name AS owner_company_name,
              u.profile_image AS owner_profile_image,
              s.created_at AS saved_at
       FROM user_saved_posts s
       JOIN user_posts p ON p.id = s.post_id
       JOIN users u ON u.id = p.owner_user_id
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE s.user_id = $1
         AND (p.owner_user_id = $1 OR ${sqlPostIsPublic})
       ORDER BY s.created_at DESC, p.id DESC`,
      [req.user.id]
    );

    const posts = result.rows.map((row) => ({
      ...toPostDto(row),
      savedAt: row.saved_at,
    }));

    return res.json({
      success: true,
      savedPosts: posts,
    });
  } catch (error) {
    logger.error('List saved posts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load saved posts.',
    });
  } finally {
    client?.release();
  }
};

const savePost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.body?.postId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureSavedPostsTable(client);

    const postRow = await readPostWithOwner(client, postId);
    if (!postRow || !canViewerAccessPost(postRow, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    await client.query(
      `INSERT INTO user_saved_posts (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING`,
      [req.user.id, postId]
    );

    return res.status(201).json({
      success: true,
      saved: true,
      postId,
    });
  } catch (error) {
    logger.error('Save post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save post.',
    });
  } finally {
    client?.release();
  }
};

const removeSavedPost = async (req, res) => {
  let client;

  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid post id.' });
    }

    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureSavedPostsTable(client);

    await client.query(
      `DELETE FROM user_saved_posts
       WHERE user_id = $1
         AND post_id = $2`,
      [req.user.id, postId]
    );

    return res.json({
      success: true,
      removed: true,
      postId,
    });
  } catch (error) {
    logger.error('Remove saved post error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove saved post.',
    });
  } finally {
    client?.release();
  }
};

module.exports = {
  listFeedPosts,
  listMyPosts,
  listProfilePosts,
  createPost,
  deletePost,
  reactToPost,
  addCommentToPost,
  reactToCommentOnPost,
  toggleSharePost,
  listSavedPosts,
  savePost,
  removeSavedPost,
};
