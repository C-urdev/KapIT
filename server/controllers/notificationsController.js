const pool = require('../config/database');
const { ensureBaseUserSchemaReady } = require('../config/runtimeSchema');
const { useMigrationManagedSchema } = require('../config/schemaManagementMode');

let notificationsTableReady = false;
let notificationsTablePromise = null;

const ensureNotificationsTable = async (client) => {
  if (useMigrationManagedSchema) {
    return;
  }

  if (notificationsTableReady) {
    return;
  }

  if (!notificationsTablePromise) {
    notificationsTablePromise = (async () => {
      const db = client || (await pool.connect());

      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            type VARCHAR(40) NOT NULL,
            title VARCHAR(160) NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_user_created
          ON notifications(user_id, created_at DESC)
        `);

        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
          ON notifications(user_id, is_read, created_at DESC)
        `);

        notificationsTableReady = true;
      } finally {
        if (!client) {
          db.release();
        }
      }
    })().catch((error) => {
      notificationsTablePromise = null;
      notificationsTableReady = false;
      throw error;
    });
  }

  await notificationsTablePromise;
};

const getNotificationAggregateKey = (row) => {
  const actorKey = row.actor_user_id || 'no-actor';
  if (row.type === 'message' || row.type === 'profile_view') {
    return `${row.type}::${actorKey}`;
  }
  return `single::${row.id}`;
};

const aggregateNotificationRows = (rows) => {
  const grouped = new Map();

  for (const row of rows) {
    const key = getNotificationAggregateKey(row);
    const metadata = row.metadata || {};
    const currentCreatedAt = row.created_at ? new Date(row.created_at).getTime() : 0;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.id,
        userId: row.user_id,
        actorUserId: row.actor_user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        metadata: {
          actorLabel: metadata.actorLabel || row.actor_label || '',
          ...metadata,
        },
        isRead: Boolean(row.is_read),
        createdAt: row.created_at,
        _createdAtMs: currentCreatedAt,
      });
      continue;
    }

    const existing = grouped.get(key);
    const isNewer = currentCreatedAt >= existing._createdAtMs;

    if (row.type === 'message') {
      const existingCount = Number(existing.metadata?.messageCount || 1);
      const rowCount = Number(metadata?.messageCount || 1);
      existing.metadata = {
        actorLabel: existing.metadata?.actorLabel || metadata.actorLabel || row.actor_label || '',
        ...existing.metadata,
        ...metadata,
        messageCount: existingCount + rowCount,
      };
    } else if (row.type === 'profile_view') {
      const existingCount = Number(existing.metadata?.viewCount || 1);
      const rowCount = Number(metadata?.viewCount || 1);
      existing.metadata = {
        actorLabel: existing.metadata?.actorLabel || metadata.actorLabel || row.actor_label || '',
        ...existing.metadata,
        ...metadata,
        viewCount: existingCount + rowCount,
      };
    }

    existing.isRead = existing.isRead && Boolean(row.is_read);

    if (isNewer) {
      existing.id = row.id;
      existing.title = row.title;
      existing.message = row.message;
      existing.createdAt = row.created_at;
      existing._createdAtMs = currentCreatedAt;
      existing.metadata = {
        actorLabel: existing.metadata?.actorLabel || metadata.actorLabel || row.actor_label || '',
        ...existing.metadata,
        ...metadata,
      };
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => right._createdAtMs - left._createdAtMs)
    .map(({ _createdAtMs, ...notification }) => notification);
};

const createNotification = async (
  client,
  {
    userId,
    actorUserId = null,
    type,
    title,
    message,
    metadata = {},
  }
) => {
  if (!client || !userId || !type || !title || !message) {
    return null;
  }

  if (actorUserId && actorUserId === userId) {
    return null;
  }

  const normalizedMetadata = { ...(metadata || {}) };
  const eventAt = normalizedMetadata.eventAt || new Date().toISOString();

  if ((type === 'message' || type === 'profile_view') && actorUserId) {
    const existingRows = await client.query(
      `SELECT id, metadata
       FROM notifications
       WHERE user_id = $1
         AND actor_user_id = $2
         AND type = $3
       ORDER BY created_at DESC, id DESC`,
      [userId, actorUserId, type]
    );

    if (existingRows.rows.length > 0) {
      const totalCount = existingRows.rows.reduce((sum, row) => {
        const rowMetadata = row.metadata || {};
        if (type === 'message') {
          return sum + Number(rowMetadata.messageCount || 1);
        }
        return sum + Number(rowMetadata.viewCount || 1);
      }, 0);

      const keeperId = existingRows.rows[0].id;
      const mergedMetadata =
        type === 'message'
          ? {
              ...normalizedMetadata,
              messageCount: totalCount + 1,
              lastMessageAt: eventAt,
            }
          : {
              ...normalizedMetadata,
              viewCount: totalCount + 1,
              lastViewedAt: eventAt,
            };

      const updateResult = await client.query(
        `UPDATE notifications
         SET title = $1,
             message = $2,
             metadata = $3::jsonb,
             is_read = FALSE,
             created_at = $4
         WHERE id = $5
         RETURNING id, user_id, actor_user_id, type, title, message, metadata, is_read, created_at`,
        [title, message, JSON.stringify(mergedMetadata), eventAt, keeperId]
      );

      await client.query(
        `DELETE FROM notifications
         WHERE user_id = $1
           AND actor_user_id = $2
           AND type = $3
           AND id <> $4`,
        [userId, actorUserId, type, keeperId]
      );

      return updateResult.rows[0] || null;
    }
  }

  const result = await client.query(
    `INSERT INTO notifications (user_id, actor_user_id, type, title, message, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, user_id, actor_user_id, type, title, message, metadata, is_read, created_at`,
    [userId, actorUserId, type, title, message, JSON.stringify(metadata || {})]
  );

  return result.rows[0] || null;
};

const buildDevErrorMeta = (error) => (
  process.env.NODE_ENV !== 'production'
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

const listNotifications = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureNotificationsTable(client);

    const result = await client.query(
      `SELECT notifications.id,
              notifications.user_id,
              notifications.actor_user_id,
              notifications.type,
              notifications.title,
              notifications.message,
              notifications.metadata,
              notifications.is_read,
              notifications.created_at,
              COALESCE(actor.company_name, actor.username, actor.email, '') AS actor_label
       FROM notifications
       LEFT JOIN users actor ON actor.id = notifications.actor_user_id
       WHERE notifications.user_id = $1
       ORDER BY notifications.created_at DESC, notifications.id DESC`,
      [req.user.id]
    );

    const notifications = aggregateNotificationRows(result.rows);

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.json({
      success: true,
      notifications: [],
      warning: 'Notifications are temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const getUnreadNotificationCount = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureNotificationsTable(client);

    const unreadRows = await client.query(
      `SELECT notifications.id,
              notifications.user_id,
              notifications.actor_user_id,
              notifications.type,
              notifications.title,
              notifications.message,
              notifications.metadata,
              notifications.is_read,
              notifications.created_at,
              COALESCE(actor.company_name, actor.username, actor.email, '') AS actor_label
       FROM notifications
       LEFT JOIN users actor ON actor.id = notifications.actor_user_id
       WHERE notifications.user_id = $1`,
      [req.user.id]
    );

    const unreadCount = aggregateNotificationRows(unreadRows.rows).filter((item) => !item.isRead).length;

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Unread notification count error:', error);
    return res.json({
      success: true,
      unreadCount: 0,
      warning: 'Unread notification count is temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const markNotificationsRead = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();
    await ensureNotificationsTable(client);

    const result = await client.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1
         AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({
      success: true,
      updatedCount: Number(result.rowCount || 0),
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.json({
      success: true,
      updatedCount: 0,
      warning: 'Notifications could not be updated right now.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  ensureNotificationsTable,
  createNotification,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
};
