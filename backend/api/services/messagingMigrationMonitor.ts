const { getUserConversations, getConversationMessagesByParticipantIds } = require('./conversationService');

const getLegacyUsersWithChats = async (client) => {
  const result = await client.query(
    `SELECT DISTINCT user_id
     FROM messages
     WHERE contact_user_id IS NOT NULL
     ORDER BY user_id ASC`
  );

  return result.rows.map((row) => String(row.user_id));
};

const getLegacyConversationList = async (client, userId) => {
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
     SELECT ranked.other_user_id AS id,
            ranked.body AS last_message,
            ranked.created_at,
            ranked.sender
     FROM ranked
     WHERE ranked.row_number = 1
     ORDER BY ranked.created_at DESC, ranked.id DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    contactId: String(row.id),
    lastMessage: row.last_message || '',
    lastMessageSender: row.sender || 'them',
    createdAtIso: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));
};

const getLegacyThreadMessages = async (client, userId, contactId) => {
  const result = await client.query(
    `SELECT id, sender_type, body, created_at
     FROM messages
     WHERE user_id = $1
       AND contact_user_id = $2
     ORDER BY created_at ASC, id ASC`,
    [userId, contactId]
  );

  const messages = [];
  const seen = new Set();

  for (const row of result.rows) {
    const key = [
      row.sender_type || '',
      row.body || '',
      row.created_at ? new Date(row.created_at).toISOString() : '',
    ].join('::');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    messages.push({
      sender: row.sender_type || '',
      text: row.body || '',
      createdAtIso: row.created_at ? new Date(row.created_at).toISOString() : null,
    });
  }

  return messages;
};

const compareMessageLists = (legacyMessages, conversationMessages) => {
  const mismatches = [];
  const maxLength = Math.max(legacyMessages.length, conversationMessages.length);

  for (let index = 0; index < maxLength; index += 1) {
    const legacy = legacyMessages[index] || null;
    const modern = conversationMessages[index] || null;

    if (!legacy || !modern) {
      mismatches.push({
        type: 'missing_message',
        index,
        legacy: legacy || null,
        conversation: modern || null,
      });
      continue;
    }

    if (legacy.sender !== modern.sender) {
      mismatches.push({ type: 'sender_mismatch', index, legacy, conversation: modern });
    }
    if (legacy.text !== modern.text) {
      mismatches.push({ type: 'body_mismatch', index, legacy, conversation: modern });
    }
    if (legacy.createdAtIso !== modern.createdAtIso) {
      mismatches.push({ type: 'timestamp_mismatch', index, legacy, conversation: modern });
    }
  }

  return mismatches;
};

const verifyReadState = async (client) => {
  const result = await client.query(
    `SELECT mrs.conversation_id,
            mrs.user_id,
            mrs.last_read_message_id,
            mrs.last_read_at,
            COUNT(cmu.id)::int AS computed_unread_count
     FROM message_read_state mrs
     LEFT JOIN conversation_messages cmu
       ON cmu.conversation_id = mrs.conversation_id
      AND (
        mrs.last_read_message_id IS NULL
        OR cmu.id > mrs.last_read_message_id
      )
      AND cmu.sender_user_id IS DISTINCT FROM mrs.user_id
     GROUP BY mrs.conversation_id, mrs.user_id, mrs.last_read_message_id, mrs.last_read_at
     ORDER BY mrs.conversation_id, mrs.user_id`
  );

  return result.rows.map((row) => ({
    conversationId: row.conversation_id,
    userId: row.user_id,
    lastReadMessageId: row.last_read_message_id,
    lastReadAt: row.last_read_at,
    computedUnreadCount: Number(row.computed_unread_count || 0),
  }));
};

const getConversationAnomalies = async (client) => {
  const duplicateKeys = await client.query(
    `SELECT legacy_key, COUNT(*)::int AS duplicate_count
     FROM conversations
     WHERE legacy_key IS NOT NULL
     GROUP BY legacy_key
     HAVING COUNT(*) > 1
     ORDER BY legacy_key ASC`
  );
  const emptyThreads = await client.query(
    `SELECT c.id AS conversation_id, c.legacy_key
     FROM conversations c
     LEFT JOIN conversation_messages cm
       ON cm.conversation_id = c.id
     GROUP BY c.id, c.legacy_key
     HAVING COUNT(cm.id) = 0
     ORDER BY c.id ASC`
  );
  const participantIssues = await client.query(
    `SELECT c.id AS conversation_id,
            c.legacy_key,
            COUNT(cp.user_id)::int AS participant_count
     FROM conversations c
     LEFT JOIN conversation_participants cp
       ON cp.conversation_id = c.id
      AND cp.left_at IS NULL
     GROUP BY c.id, c.legacy_key
     HAVING COUNT(cp.user_id) <> 2
     ORDER BY c.id ASC`
  );
  const dualWriteGaps = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM messages m
     WHERE m.user_id = m.sender_user_id
       AND m.sender_user_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM conversation_messages cm
         WHERE cm.legacy_message_id = m.id
       )`
  );

  return {
    duplicateConversationKeys: duplicateKeys.rows.map((row) => ({
      legacyKey: row.legacy_key,
      duplicateCount: Number(row.duplicate_count || 0),
    })),
    emptyConversationThreads: emptyThreads.rows.map((row) => ({
      conversationId: row.conversation_id,
      legacyKey: row.legacy_key || '',
    })),
    inconsistentParticipants: participantIssues.rows.map((row) => ({
      conversationId: row.conversation_id,
      legacyKey: row.legacy_key || '',
      participantCount: Number(row.participant_count || 0),
    })),
    dualWriteGapCount: Number(dualWriteGaps.rows[0]?.count || 0),
  };
};

const compareUserThread = async (client, userId, contactId) => {
  const legacyThreadList = await getLegacyConversationList(client, userId);
  const legacyThread = legacyThreadList.find((item) => item.contactId === String(contactId)) || null;
  const legacyMessages = await getLegacyThreadMessages(client, userId, contactId);

  const conversationList = await getUserConversations(client, userId);
  const conversationThread = conversationList.find((item) => String(item.id) === String(contactId)) || null;
  const conversationResult = await getConversationMessagesByParticipantIds(client, userId, contactId, {
    markAsRead: false,
  });
  const conversationMessages = conversationResult.messages.map((row) => ({
    sender: row.sender,
    text: row.text,
    createdAtIso: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  }));

  const mismatches = compareMessageLists(legacyMessages, conversationMessages);
  const summaryMismatch =
    (legacyThread?.lastMessage || '') !== (conversationThread?.lastMessage || '') ||
    (legacyThread?.lastMessageSender || '') !== (conversationThread?.lastMessageSender || '') ||
    (legacyThread?.createdAtIso || null) !==
      (conversationThread?.createdAt ? new Date(conversationThread.createdAt).toISOString() : null);

  return {
    userId,
    contactId: String(contactId),
    conversationId: conversationResult.conversation?.id || conversationThread?.conversationId || null,
    legacyExists: Boolean(legacyThread || legacyMessages.length),
    conversationExists: Boolean(conversationThread || conversationResult.conversation),
    legacyMessageCount: legacyMessages.length,
    conversationMessageCount: conversationMessages.length,
    legacyThread: legacyThread || null,
    conversationThread: conversationThread || null,
    mismatches,
    summaryMismatch,
  };
};

const buildParityReport = async (client) => {
  const users = await getLegacyUsersWithChats(client);
  const report = {
    usersChecked: users.length,
    matchedThreads: [],
    mismatchedThreads: [],
    missingConversationThreads: [],
    duplicateConversationThreads: [],
    anomalies: await getConversationAnomalies(client),
    readState: await verifyReadState(client),
  };

  for (const userId of users) {
    const legacyThreads = await getLegacyConversationList(client, userId);
    const conversationThreads = await getUserConversations(client, userId);
    const legacyByContact = new Map<string, {
      contactId: string;
      lastMessage: string;
      lastMessageSender: string;
      createdAtIso: string | null;
    }>(
      legacyThreads.map((item) => [item.contactId, item])
    );
    const convoByContact = new Map<string, {
      id: string;
      lastMessage?: string;
      lastMessageSender?: string;
      createdAt?: string | Date | null;
      unreadCount?: number;
    }>();

    for (const thread of conversationThreads) {
      const key = String(thread.id);
      if (convoByContact.has(key)) {
        report.duplicateConversationThreads.push({ userId, contactId: key });
        continue;
      }
      convoByContact.set(key, thread);
    }

    for (const [contactId, legacyThread] of legacyByContact.entries()) {
      const comparison = await compareUserThread(client, userId, contactId);
      const conversationThread = convoByContact.get(contactId);

      if (!conversationThread) {
        report.missingConversationThreads.push({ userId, contactId, legacyThread });
        continue;
      }

      const threadSummary = {
        userId,
        contactId,
        legacyConversationCount: 1,
        conversationConversationCount: 1,
        legacyMessageCount: comparison.legacyMessageCount,
        conversationMessageCount: comparison.conversationMessageCount,
        legacyLastMessage: legacyThread.lastMessage,
        conversationLastMessage: conversationThread.lastMessage,
        legacyLastMessageSender: legacyThread.lastMessageSender,
        conversationLastMessageSender: conversationThread.lastMessageSender,
        legacyLastMessageAt: legacyThread.createdAtIso,
        conversationLastMessageAt: conversationThread.createdAt ? new Date(conversationThread.createdAt).toISOString() : null,
        mismatches: comparison.mismatches,
        unreadCount: Number(conversationThread.unreadCount || 0),
      };

      if (comparison.mismatches.length || comparison.summaryMismatch) {
        report.mismatchedThreads.push(threadSummary);
      } else {
        report.matchedThreads.push(threadSummary);
      }
    }
  }

  return report;
};

const getMigrationHealthSummary = async (client) => {
  const counts = [];
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM messages WHERE user_id = sender_user_id AND sender_user_id IS NOT NULL`));
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM conversations`));
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM conversation_participants`));
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM conversation_messages`));
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM conversation_messages WHERE legacy_message_id IS NOT NULL`));
  counts.push(await client.query(`SELECT COUNT(*)::int AS count FROM message_read_state`));
  const anomalies = await getConversationAnomalies(client);
  const readState = await verifyReadState(client);

  return {
    legacyPrimaryMessageRows: Number(counts[0].rows[0]?.count || 0),
    conversations: Number(counts[1].rows[0]?.count || 0),
    participants: Number(counts[2].rows[0]?.count || 0),
    conversationMessages: Number(counts[3].rows[0]?.count || 0),
    linkedLegacyMessages: Number(counts[4].rows[0]?.count || 0),
    readStateRows: Number(counts[5].rows[0]?.count || 0),
    anomalies,
    readState,
  };
};

module.exports = {
  getLegacyUsersWithChats,
  getLegacyConversationList,
  getLegacyThreadMessages,
  compareMessageLists,
  verifyReadState,
  getConversationAnomalies,
  compareUserThread,
  buildParityReport,
  getMigrationHealthSummary,
};
