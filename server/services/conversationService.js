const crypto = require('crypto');

const DIRECT_CONVERSATION_TYPE = 'direct';

const buildDirectConversationKey = (firstUserId, secondUserId) => {
  const normalized = [String(firstUserId || '').trim(), String(secondUserId || '').trim()]
    .filter(Boolean)
    .sort();

  if (normalized.length !== 2 || normalized[0] === normalized[1]) {
    throw new Error('Direct conversations require two distinct participant ids.');
  }

  return `direct:${normalized[0]}:${normalized[1]}`;
};

const shouldUseConversationRead = (req) => {
  const requestedSource = String(req?.query?.source || '').trim().toLowerCase();
  if (requestedSource === 'conversation' || requestedSource === 'conversations' || requestedSource === 'v2') {
    return true;
  }

  return String(process.env.MESSAGES_READ_SOURCE || '').trim().toLowerCase() === 'conversations';
};

const ensureDirectConversation = async (client, firstUserId, secondUserId, createdByUserId = null) => {
  const legacyKey = buildDirectConversationKey(firstUserId, secondUserId);

  const existing = await findDirectConversation(client, firstUserId, secondUserId);
  let conversation = existing;

  if (!conversation) {
    try {
      const created = await client.query(
        `INSERT INTO conversations (id, conversation_type, created_by_user_id, legacy_key, last_message_at)
         VALUES ($1, $2, $3, $4, NULL)
         RETURNING id, legacy_key, conversation_type, created_at, updated_at, last_message_at`,
        [crypto.randomUUID(), DIRECT_CONVERSATION_TYPE, createdByUserId || firstUserId, legacyKey]
      );
      conversation = created.rows[0] || null;
    } catch (error) {
      if (String(error?.code) !== '23505') {
        throw error;
      }

      conversation = await findDirectConversation(client, firstUserId, secondUserId);
    }
  }

  if (!conversation) {
    throw new Error('Unable to create or fetch direct conversation.');
  }

  const participants = [String(firstUserId), String(secondUserId)];
  for (const participantUserId of participants) {
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversation.id, participantUserId]
    );
  }

  return conversation;
};

const findDirectConversation = async (client, firstUserId, secondUserId) => {
  const legacyKey = buildDirectConversationKey(firstUserId, secondUserId);

  const existing = await client.query(
    `SELECT id, legacy_key, conversation_type, created_at, updated_at, last_message_at
     FROM conversations
     WHERE legacy_key = $1
     LIMIT 1`,
    [legacyKey]
  );

  return existing.rows[0] || null;
};

const insertConversationMessage = async (
  client,
  {
    conversationId,
    senderUserId,
    body,
    createdAt = null,
    legacyMessageId = null,
    metadata = {},
  }
) => {
  const result = await client.query(
    `INSERT INTO conversation_messages (
       conversation_id,
       sender_user_id,
       body,
       metadata,
       legacy_message_id,
       created_at
     )
     VALUES ($1, $2, $3, $4::jsonb, $5, COALESCE($6, NOW()))
     RETURNING id, conversation_id, sender_user_id, body, metadata, legacy_message_id, created_at`,
    [
      conversationId,
      senderUserId || null,
      body,
      JSON.stringify(metadata || {}),
      legacyMessageId || null,
      createdAt,
    ]
  );

  const message = result.rows[0] || null;
  if (!message) {
    throw new Error('Unable to insert conversation message.');
  }

  await client.query(
    `UPDATE conversations
     SET updated_at = NOW(),
         last_message_at = $2
     WHERE id = $1`,
    [conversationId, message.created_at]
  );

  return message;
};

const upsertMessageReadState = async (client, { conversationId, userId, lastReadMessageId = null, lastReadAt = null }) => {
  await client.query(
    `INSERT INTO message_read_state (conversation_id, user_id, last_read_message_id, last_read_at)
     VALUES ($1, $2, $3, COALESCE($4, NOW()))
     ON CONFLICT (conversation_id, user_id) DO UPDATE
     SET last_read_message_id = EXCLUDED.last_read_message_id,
         last_read_at = EXCLUDED.last_read_at`,
    [conversationId, userId, lastReadMessageId, lastReadAt]
  );
};

const getUserConversations = async (client, userId) => {
  const result = await client.query(
    `SELECT c.id,
            c.legacy_key,
            c.last_message_at,
            c.created_at,
            other.id AS other_user_id,
            other.username,
            other.email,
            other.user_type,
            other.company_name,
            other.profile_image,
            latest.id AS last_message_id,
            latest.body AS last_message,
            latest.created_at AS last_message_created_at,
            latest.sender_user_id AS last_message_sender_user_id,
            mrs.last_read_message_id,
            mrs.last_read_at,
            COALESCE(unread.unread_count, 0)::int AS unread_count
     FROM conversation_participants cp
     JOIN conversations c
       ON c.id = cp.conversation_id
     JOIN conversation_participants other_cp
       ON other_cp.conversation_id = c.id
      AND other_cp.user_id <> cp.user_id
      AND other_cp.left_at IS NULL
     JOIN users other
       ON other.id = other_cp.user_id
     LEFT JOIN LATERAL (
       SELECT cm.id, cm.body, cm.created_at, cm.sender_user_id
       FROM conversation_messages cm
       WHERE cm.conversation_id = c.id
       ORDER BY cm.created_at DESC, cm.id DESC
       LIMIT 1
     ) latest ON TRUE
     LEFT JOIN message_read_state mrs
       ON mrs.conversation_id = c.id
      AND mrs.user_id = cp.user_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS unread_count
       FROM conversation_messages cmu
       WHERE cmu.conversation_id = c.id
         AND (
           mrs.last_read_message_id IS NULL
           OR cmu.id > mrs.last_read_message_id
         )
         AND cmu.sender_user_id IS DISTINCT FROM cp.user_id
     ) unread ON TRUE
     WHERE cp.user_id = $1
       AND cp.left_at IS NULL
     ORDER BY COALESCE(c.last_message_at, latest.created_at, c.created_at) DESC, c.id ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.other_user_id,
    conversationId: row.id,
    username: row.username || '',
    email: row.email || '',
    type: row.user_type || '',
    companyName: row.company_name || '',
    profileImage: row.profile_image || '',
    displayName: row.company_name || row.username || row.email || 'Account',
    lastMessage: row.last_message || '',
    lastMessageSender:
      row.last_message_sender_user_id && row.last_message_sender_user_id === userId ? 'me' : 'them',
    createdAt: row.last_message_created_at || row.last_message_at || row.created_at,
    unreadCount: Number(row.unread_count || 0),
  }));
};

const getConversationMessagesByParticipantIds = async (client, userId, contactUserId, options = {}) => {
  const {
    markAsRead = true,
    limit = 40,
    beforeCreatedAt = null,
    recentHours = null,
  } = options;
  const conversation = await findDirectConversation(client, userId, contactUserId);
  if (!conversation) {
    return {
      conversation: null,
      messages: [],
      hasMore: false,
    };
  }

  const parsedLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 40;
  const beforeDate = beforeCreatedAt ? new Date(beforeCreatedAt) : null;
  const hasValidBeforeDate = beforeDate instanceof Date && !Number.isNaN(beforeDate.getTime());
  const parsedRecentHours = Number.isFinite(Number(recentHours)) ? Math.max(1, Math.min(48, Number(recentHours))) : null;

  const whereClauses = ['cm.conversation_id = $1'];
  const values = [conversation.id];

  if (hasValidBeforeDate) {
    values.push(beforeDate.toISOString());
    whereClauses.push(`cm.created_at < $${values.length}`);
  } else if (parsedRecentHours) {
    values.push(parsedRecentHours);
    whereClauses.push(`cm.created_at >= NOW() - ($${values.length} * INTERVAL '1 hour')`);
  }

  values.push(parsedLimit + 1);

  const result = await client.query(
    `SELECT cm.id,
            cm.sender_user_id,
            cm.body,
            cm.created_at,
            cm.legacy_message_id
     FROM conversation_messages cm
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY cm.created_at DESC, cm.id DESC
     LIMIT $${values.length}`,
    values
  );

  const hasMore = result.rows.length > parsedLimit;
  const rowsToReturn = hasMore ? result.rows.slice(0, parsedLimit) : result.rows;
  const ascendingRows = rowsToReturn.reverse();

  const messages = ascendingRows.map((row) => ({
    id: row.id,
    sender: row.sender_user_id === userId ? 'me' : 'them',
    text: row.body,
    createdAt: row.created_at,
    legacyMessageId: row.legacy_message_id || null,
  }));

  const lastMessage = messages[messages.length - 1] || null;
  if (markAsRead && lastMessage) {
    await upsertMessageReadState(client, {
      conversationId: conversation.id,
      userId,
      lastReadMessageId: lastMessage.id,
      lastReadAt: lastMessage.createdAt,
    });
  }

  return {
    conversation,
    messages,
    hasMore,
  };
};

module.exports = {
  buildDirectConversationKey,
  shouldUseConversationRead,
  findDirectConversation,
  ensureDirectConversation,
  insertConversationMessage,
  upsertMessageReadState,
  getUserConversations,
  getConversationMessagesByParticipantIds,
};
