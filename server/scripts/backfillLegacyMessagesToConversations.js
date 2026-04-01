const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureMessagingSchemaReady } = require('../config/runtimeSchema');
const {
  buildDirectConversationKey,
  ensureDirectConversation,
  insertConversationMessage,
  upsertMessageReadState,
} = require('../services/conversationService');

const DRY_RUN = process.argv.includes('--dry-run');
const VERIFY_ONLY = process.argv.includes('--verify');

const normalizeLegacyRow = (row) => {
  const senderUserId =
    row.sender_user_id ||
    (row.sender_type === 'me' ? row.user_id : row.contact_user_id) ||
    null;
  const recipientUserId =
    row.recipient_user_id ||
    (row.sender_type === 'me' ? row.contact_user_id : row.user_id) ||
    null;

  if (!senderUserId || !recipientUserId || senderUserId === recipientUserId) {
    return null;
  }

  return {
    id: Number(row.id),
    senderUserId: String(senderUserId),
    recipientUserId: String(recipientUserId),
    conversationKey: buildDirectConversationKey(senderUserId, recipientUserId),
    body: row.body || '',
    createdAt: row.created_at,
  };
};

const buildMessageFingerprint = (normalized) =>
  [
    normalized.conversationKey,
    normalized.senderUserId,
    normalized.recipientUserId,
    normalized.body,
    normalized.createdAt ? new Date(normalized.createdAt).toISOString() : '',
  ].join('::');

const loadCanonicalLegacyMessages = async (client) => {
  const result = await client.query(
    `SELECT id,
            user_id,
            contact_user_id,
            sender_user_id,
            recipient_user_id,
            sender_type,
            body,
            created_at
     FROM messages
     ORDER BY created_at ASC, id ASC`
  );

  const canonical = [];
  const seen = new Set();

  for (const row of result.rows) {
    const normalized = normalizeLegacyRow(row);
    if (!normalized) {
      continue;
    }

    const fingerprint = buildMessageFingerprint(normalized);
    if (seen.has(fingerprint)) {
      continue;
    }

    seen.add(fingerprint);
    canonical.push(normalized);
  }

  return canonical;
};

const verifyBackfill = async (client) => {
  const canonicalMessages = await loadCanonicalLegacyMessages(client);
  const existingMessages = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM conversation_messages
     WHERE legacy_message_id IS NOT NULL`
  );
  const existingConversations = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM conversations
     WHERE legacy_key IS NOT NULL`
  );

  const expectedConversationCount = new Set(canonicalMessages.map((item) => item.conversationKey)).size;

  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    verifyOnly: VERIFY_ONLY,
    canonicalLegacyMessages: canonicalMessages.length,
    expectedConversations: expectedConversationCount,
    backfilledConversationMessages: existingMessages.rows[0]?.count || 0,
    existingConversations: existingConversations.rows[0]?.count || 0,
  }, null, 2));
};

const main = async () => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();

    const canonicalMessages = await loadCanonicalLegacyMessages(client);
    const conversationsByKey = new Map();
    const metrics = {
      canonicalLegacyMessages: canonicalMessages.length,
      conversationsCreated: 0,
      participantsEnsured: 0,
      conversationMessagesCreated: 0,
      legacyMessagesLinked: 0,
      skippedExistingConversationMessages: 0,
      skippedInvalidLegacyRows: 0,
    };

    if (VERIFY_ONLY) {
      await verifyBackfill(client);
      return;
    }

    if (!DRY_RUN) {
      await client.query('BEGIN');
    }

    for (const message of canonicalMessages) {
      const existedBefore = conversationsByKey.has(message.conversationKey);
      let conversation = conversationsByKey.get(message.conversationKey);
      if (!conversation) {
        const existingConversation = await client.query(
          `SELECT id
           FROM conversations
           WHERE legacy_key = $1
           LIMIT 1`,
          [message.conversationKey]
        );
        conversation = await ensureDirectConversation(client, message.senderUserId, message.recipientUserId, message.senderUserId);
        conversationsByKey.set(message.conversationKey, conversation);
        if (!existingConversation.rows.length) {
          metrics.conversationsCreated += 1;
        }
      }

      if (!existedBefore) {
        metrics.participantsEnsured += 2;
      }

      const existing = await client.query(
        `SELECT id
         FROM conversation_messages
         WHERE legacy_message_id = $1
         LIMIT 1`,
        [message.id]
      );

      if (!existing.rows.length) {
        const inserted = await insertConversationMessage(client, {
          conversationId: conversation.id,
          senderUserId: message.senderUserId,
          body: message.body,
          createdAt: message.createdAt,
          legacyMessageId: message.id,
          metadata: {
            migratedFromLegacy: true,
            sourceTable: 'messages',
          },
        });

        await upsertMessageReadState(client, {
          conversationId: conversation.id,
          userId: message.senderUserId,
          lastReadMessageId: inserted.id,
          lastReadAt: inserted.createdAt,
        });

        metrics.conversationMessagesCreated += 1;
        metrics.legacyMessagesLinked += inserted.legacy_message_id ? 1 : 0;
      } else {
        metrics.skippedExistingConversationMessages += 1;
      }
    }

    if (!DRY_RUN) {
      await client.query('COMMIT');
    }

    console.log(JSON.stringify(metrics, null, 2));
    await verifyBackfill(client);
  } catch (error) {
    if (client && !DRY_RUN && !VERIFY_ONLY) {
      await client.query('ROLLBACK');
    }
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  } finally {
    client?.release();
  }
};

main();
