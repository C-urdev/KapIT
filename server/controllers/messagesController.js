const pool = require('../config/database');
const { createNotification, ensureNotificationsTable } = require('./notificationsController');
const { ensureBaseUserSchemaReady, ensureMessagingSchemaReady } = require('../config/runtimeSchema');
const { useMigrationManagedSchema } = require('../config/schemaManagementMode');
const {
  ensureDirectConversation,
  insertConversationMessage,
  upsertMessageReadState,
  getUserConversations,
  getConversationMessagesByParticipantIds,
} = require('../services/conversationService');
const {
  getLegacyConversationList,
  getLegacyThreadMessages,
} = require('../services/messagingMigrationMonitor');
const {
  getConversationReadDecision,
  shouldShadowCompareConversationReads,
  recordConversationReadDecision,
  recordConversationReadServed,
  recordConversationReadFallback,
  recordConversationListCountMismatch,
  recordConversationThreadCountMismatch,
  recordDualWriteFailure,
} = require('../services/messagingRolloutService');

let messagesTableReady = false;
let messagesTablePromise = null;
let messageMaintenanceComplete = false;
let messageMaintenancePromise = null;

const ensureMessagesTable = async (client) => {
  if (useMigrationManagedSchema) {
    return;
  }

  if (!messagesTableReady) {
    if (!messagesTablePromise) {
      messagesTablePromise = (async () => {
        const db = client || (await pool.connect());

        try {
          await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
              id BIGSERIAL PRIMARY KEY,
              sender_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
              contact_name VARCHAR(120) NOT NULL,
              sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('me', 'them')),
              body TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES users(id) ON DELETE CASCADE`);
          await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE`);
          await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE`);
          await db.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_user_contact_time
            ON messages(user_id, contact_name, created_at)
          `);
          await db.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_user_contact_user_time
            ON messages(user_id, contact_user_id, created_at)
          `);
          await db.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_time
            ON messages(sender_user_id, recipient_user_id, created_at)
          `);
          await db.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_recipient_sender_time
            ON messages(recipient_user_id, sender_user_id, created_at)
          `);

          messagesTableReady = true;
        } finally {
          if (!client) {
            db.release();
          }
        }
      })().catch((error) => {
        messagesTablePromise = null;
        messagesTableReady = false;
        throw error;
      });
    }

    await messagesTablePromise;
  }

  if (messageMaintenanceComplete) {
    return;
  }

  if (!messageMaintenancePromise) {
    messageMaintenancePromise = (async () => {
      const db = client || (await pool.connect());

      try {
        await db.query(`
          UPDATE messages
          SET contact_user_id = recipient_user_id
          WHERE contact_user_id IS NULL
            AND sender_user_id IS NOT NULL
            AND recipient_user_id IS NOT NULL
            AND user_id = sender_user_id
        `);

        await db.query(`
          UPDATE messages
          SET contact_user_id = sender_user_id
          WHERE contact_user_id IS NULL
            AND sender_user_id IS NOT NULL
            AND recipient_user_id IS NOT NULL
            AND user_id = recipient_user_id
        `);

        await db.query(`
          WITH ranked_duplicates AS (
            SELECT
              id,
              ROW_NUMBER() OVER (
                PARTITION BY
                  user_id,
                  COALESCE(contact_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
                  COALESCE(sender_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
                  COALESCE(recipient_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
                  sender_type,
                  body,
                  created_at
                ORDER BY id ASC
              ) AS duplicate_rank
            FROM messages
          )
          DELETE FROM messages
          WHERE id IN (
            SELECT id
            FROM ranked_duplicates
            WHERE duplicate_rank > 1
          )
        `);

        await db.query(`
          INSERT INTO messages (
            sender_user_id,
            recipient_user_id,
            user_id,
            contact_user_id,
            contact_name,
            sender_type,
            body,
            created_at
          )
          SELECT
            m.sender_user_id,
            m.recipient_user_id,
            m.recipient_user_id,
            m.sender_user_id,
            '',
            'them',
            m.body,
            m.created_at
          FROM messages m
          WHERE m.sender_user_id IS NOT NULL
            AND m.recipient_user_id IS NOT NULL
            AND m.user_id = m.sender_user_id
            AND NOT EXISTS (
              SELECT 1
              FROM messages mirror
              WHERE mirror.user_id = m.recipient_user_id
                AND mirror.contact_user_id = m.sender_user_id
                AND mirror.sender_user_id = m.sender_user_id
                AND mirror.recipient_user_id = m.recipient_user_id
                AND mirror.body = m.body
                AND mirror.created_at = m.created_at
            )
        `);

        messageMaintenanceComplete = true;
      } finally {
        if (!client) {
          db.release();
        }
      }
    })().catch((error) => {
      messageMaintenancePromise = null;
      messageMaintenanceComplete = false;
      throw error;
    });
  }

  await messageMaintenancePromise;
};

const getAccountLabel = (row) => row?.company_name || row?.username || row?.email || 'Account';

const buildDevErrorMeta = (error) => (
  process.env.NODE_ENV !== 'production'
    ? {
        errorDetail: error?.message || String(error),
        errorCode: error?.code || '',
      }
    : {}
);

const shouldLogMessagingMigration = () => String(process.env.LOG_MESSAGING_MIGRATION || '').trim().toLowerCase() === 'true';

const logMessagingMigrationEvent = (event, payload) => {
  if (!shouldLogMessagingMigration()) {
    return;
  }

  console.info(`[messaging-migration] ${event}`, payload);
};

const listConversations = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();
    await ensureMessagesTable(client);

    const readDecision = getConversationReadDecision(req, req.user);
    recordConversationReadDecision(readDecision);

    if (readDecision.enabled) {
      const conversations = await getUserConversations(client, req.user.id);
      if (conversations.length > 0) {
        if (shouldShadowCompareConversationReads()) {
          const legacyConversations = await getLegacyConversationList(client, req.user.id);
          if (legacyConversations.length !== conversations.length) {
            recordConversationListCountMismatch();
            logMessagingMigrationEvent('conversation_list_count_mismatch', {
              userId: req.user.id,
              conversationCount: conversations.length,
              legacyCount: legacyConversations.length,
              reason: readDecision.reason,
            });
          }
        }

        recordConversationReadServed();
        return res.json({ success: true, conversations, source: 'conversations' });
      }

      recordConversationReadFallback('no_conversation_rows');
      logMessagingMigrationEvent('conversation_list_fallback', {
        userId: req.user.id,
        reason: 'no_conversation_rows',
        rolloutReason: readDecision.reason,
      });
    }

    const result = await client.query(
      `WITH conversation_rows AS (
         SELECT
           m.id,
           m.body,
           m.created_at,
           m.contact_user_id AS other_user_id,
           m.sender_type AS sender
         FROM messages m
         WHERE m.user_id = $1
           AND m.contact_user_id IS NOT NULL
       ),
       ranked AS (
         SELECT
           conversation_rows.*,
           ROW_NUMBER() OVER (PARTITION BY other_user_id ORDER BY created_at DESC, id DESC) AS row_number
         FROM conversation_rows
         WHERE other_user_id IS NOT NULL
       )
       SELECT
         ranked.other_user_id AS id,
         users.username,
         users.email,
         users.user_type,
         users.company_name,
         users.profile_image,
         ranked.body AS last_message,
         ranked.created_at,
         ranked.sender
       FROM ranked
       JOIN users ON users.id = ranked.other_user_id
       WHERE ranked.row_number = 1
       ORDER BY ranked.created_at DESC, ranked.id DESC`,
      [req.user.id]
    );

    const conversations = result.rows.map((row) => ({
      id: row.id,
      username: row.username || '',
      email: row.email || '',
      type: row.user_type || '',
      companyName: row.company_name || '',
      profileImage: row.profile_image || '',
      displayName: getAccountLabel(row),
      lastMessage: row.last_message || '',
      lastMessageSender: row.sender || 'them',
      createdAt: row.created_at,
    }));

    res.json({ success: true, conversations, source: 'legacy' });
  } catch (error) {
    console.error('List conversations error:', error);
    res.json({
      success: true,
      conversations: [],
      warning: 'Conversations are temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const listMessages = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();
    await ensureMessagesTable(client);

    const contactId = String(req.params.contact || '').trim();
    if (!contactId) {
      return res.status(400).json({ success: false, message: 'Contact id is required' });
    }

    const rawBeforeCreatedAt = String(req.query?.beforeCreatedAt || '').trim();
    const beforeDate = rawBeforeCreatedAt ? new Date(rawBeforeCreatedAt) : null;
    const hasBeforeCursor = beforeDate instanceof Date && !Number.isNaN(beforeDate.getTime());
    const beforeCreatedAt = hasBeforeCursor ? beforeDate.toISOString() : null;
    const limitParam = Number(req.query?.limit);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 40;
    const recentHoursParam = Number(req.query?.recentHours);
    const recentHours = hasBeforeCursor
      ? null
      : Number.isFinite(recentHoursParam)
        ? Math.max(1, Math.min(48, recentHoursParam))
        : null;

    const readDecision = getConversationReadDecision(req, req.user);
    recordConversationReadDecision(readDecision);

    if (readDecision.enabled) {
      const conversationResult = await getConversationMessagesByParticipantIds(client, req.user.id, contactId, {
        markAsRead: !hasBeforeCursor,
        limit,
        beforeCreatedAt,
        recentHours,
      });
      let fallbackReason = 'conversation_missing';
      if (conversationResult.conversation) {
        // If conversation rows exist but contain no messages yet, try legacy storage
        // so historical threads remain visible during migration.
        if (!hasBeforeCursor && conversationResult.messages.length === 0) {
          fallbackReason = 'empty_conversation_messages';
        } else {
          if (shouldShadowCompareConversationReads() && !hasBeforeCursor && !recentHours) {
            const legacyMessages = await getLegacyThreadMessages(client, req.user.id, contactId);
            if (legacyMessages.length !== conversationResult.messages.length) {
              recordConversationThreadCountMismatch();
              logMessagingMigrationEvent('conversation_thread_count_mismatch', {
                userId: req.user.id,
                contactId,
                conversationCount: conversationResult.messages.length,
                legacyCount: legacyMessages.length,
                reason: readDecision.reason,
              });
            }
          }

          recordConversationReadServed();
          return res.json({
            success: true,
            messages: conversationResult.messages,
            hasMore: Boolean(conversationResult.hasMore),
            source: 'conversations',
            conversationId: conversationResult.conversation.id,
          });
        }
      }

      recordConversationReadFallback(fallbackReason);
      logMessagingMigrationEvent('conversation_thread_fallback', {
        userId: req.user.id,
        contactId,
        reason: fallbackReason,
        rolloutReason: readDecision.reason,
      });
    }

    const whereClauses = [
      'user_id = $1',
      `(contact_user_id = $2 OR (
        contact_user_id IS NULL
        AND (
          (sender_user_id = $1 AND recipient_user_id = $2)
          OR (sender_user_id = $2 AND recipient_user_id = $1)
        )
      ) OR (
        contact_user_id IS NULL
        AND (sender_user_id IS NULL OR recipient_user_id IS NULL)
        AND COALESCE(NULLIF(TRIM(contact_name), ''), '') <> ''
        AND LOWER(TRIM(contact_name)) IN (
          SELECT DISTINCT LOWER(TRIM(value_text))
          FROM (
            SELECT u.username AS value_text
            FROM users u
            WHERE u.id = $2
            UNION ALL
            SELECT u.email AS value_text
            FROM users u
            WHERE u.id = $2
            UNION ALL
            SELECT u.company_name AS value_text
            FROM users u
            WHERE u.id = $2
          ) contact_labels
          WHERE COALESCE(NULLIF(TRIM(value_text), ''), '') <> ''
        )
      ))`,
    ];
    const values = [req.user.id, contactId];

    if (hasBeforeCursor) {
      values.push(beforeCreatedAt);
      whereClauses.push(`created_at < $${values.length}`);
    } else if (recentHours) {
      values.push(recentHours);
      whereClauses.push(`created_at >= NOW() - ($${values.length} * INTERVAL '1 hour')`);
    }

    values.push(limit + 1);
    const result = await client.query(
      `SELECT id,
              sender_type,
              body,
              created_at
       FROM messages
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length}`,
      values
    );

    const messages = [];
    const seenMessages = new Set();
    const hasMore = result.rows.length > limit;
    const rowsToReturn = hasMore ? result.rows.slice(0, limit) : result.rows;
    const ascendingRows = rowsToReturn.reverse();

    for (const row of ascendingRows) {
      const messageKey = [
        row.sender_type || '',
        row.body || '',
        row.created_at ? new Date(row.created_at).toISOString() : '',
      ].join('::');

      if (seenMessages.has(messageKey)) {
        continue;
      }

      seenMessages.add(messageKey);
      messages.push({
        id: row.id,
        sender: row.sender_type,
        text: row.body,
        createdAt: row.created_at,
      });
    }

    res.json({ success: true, messages, hasMore, source: 'legacy' });
  } catch (error) {
    console.error('List messages error:', error);
    res.json({
      success: true,
      messages: [],
      warning: 'Messages are temporarily unavailable.',
      ...buildDevErrorMeta(error),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const sendMessage = async (req, res) => {
  let client;
  let sendPhase = 'init';
  let sendMeta = {
    userId: req.user?.id || null,
    contactId: null,
    legacyMessageId: null,
    conversationId: null,
    conversationMessageId: null,
  };

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();
    await ensureMessagesTable(client);
    await client.query('BEGIN');

    const contactId = String(req.params.contact || '').trim();
    const text = req.body?.text?.trim();

    if (!contactId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Contact id is required' });
    }

    sendMeta.contactId = contactId;

    if (!text) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (contactId === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'You cannot message your own account' });
    }

    const contactResult = await client.query(
      `SELECT id, username, email, company_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [contactId]
    );

    if (!contactResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const senderResult = await client.query(
      `SELECT id, username, email, company_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );

    if (!senderResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }

    await ensureNotificationsTable(client);
    sendPhase = 'legacy_write';

    const result = await client.query(
      `INSERT INTO messages (sender_user_id, recipient_user_id, user_id, contact_user_id, contact_name, sender_type, body)
       VALUES ($1, $2, $1, $2, '', 'me', $3)
       RETURNING id, sender_type, body, created_at`,
      [req.user.id, contactId, text]
    );
    sendMeta.legacyMessageId = result.rows[0]?.id || null;

    await client.query(
      `INSERT INTO messages (sender_user_id, recipient_user_id, user_id, contact_user_id, contact_name, sender_type, body)
       VALUES ($1, $2, $2, $1, '', 'them', $3)`,
      [req.user.id, contactId, text]
    );

    sendPhase = 'conversation_write';
    const conversation = await ensureDirectConversation(client, req.user.id, contactId, req.user.id);
    sendMeta.conversationId = conversation.id;
    const conversationMessage = await insertConversationMessage(client, {
      conversationId: conversation.id,
      senderUserId: req.user.id,
      body: text,
      createdAt: result.rows[0]?.created_at || null,
      legacyMessageId: result.rows[0]?.id || null,
      metadata: {
        migratedFromLegacy: false,
        writeMode: 'dual',
      },
    });
    sendMeta.conversationMessageId = conversationMessage.id;

    await upsertMessageReadState(client, {
      conversationId: conversation.id,
      userId: req.user.id,
      lastReadMessageId: conversationMessage.id,
      lastReadAt: conversationMessage.created_at,
    });

    await client.query(
      `INSERT INTO message_read_state (conversation_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversation.id, contactId]
    );

    const senderLabel = getAccountLabel(senderResult.rows[0]);
    await createNotification(client, {
      userId: contactId,
      actorUserId: req.user.id,
      type: 'message',
      title: 'New message',
      message: 'A user messaged you.',
      metadata: {
        actorLabel: senderLabel,
        contactUserId: req.user.id,
        preview: text.slice(0, 120),
        eventAt: new Date().toISOString(),
      },
    });

    sendPhase = 'commit';
    await client.query('COMMIT');

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      message: {
        id: row.id,
        sender: row.sender_type,
        text: row.body,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    recordDualWriteFailure();
    logMessagingMigrationEvent('send_failure', {
      phase: sendPhase,
      ...sendMeta,
      errorMessage: error?.message || String(error),
      errorCode: error?.code || '',
    });
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending message' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  listConversations,
  listMessages,
  sendMessage,
};
