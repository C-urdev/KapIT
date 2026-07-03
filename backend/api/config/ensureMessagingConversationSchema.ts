const pool = require('./database');
const { isDatabaseConnectivityError, summarizeDatabaseConnectivityError } = require('./database');

const ensureMessagingConversationSchema = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct',
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        legacy_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_message_at TIMESTAMPTZ
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        left_at TIMESTAMPTZ,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        PRIMARY KEY (conversation_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        body TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL DEFAULT 'text',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        legacy_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS message_read_state (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_message_id BIGINT REFERENCES conversation_messages(id) ON DELETE SET NULL,
        last_read_at TIMESTAMPTZ,
        PRIMARY KEY (conversation_id, user_id)
      );
    `);

    await client.query(`
      ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct',
        ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS legacy_key TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE conversation_participants
        ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';
    `);

    await client.query(`
      ALTER TABLE conversation_messages
        ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS body TEXT,
        ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'text',
        ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS legacy_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    await client.query(`
      ALTER TABLE message_read_state
        ADD COLUMN IF NOT EXISTS last_read_message_id BIGINT REFERENCES conversation_messages(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
      ON conversations(last_message_at DESC NULLS LAST, created_at DESC);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_legacy_key
      ON conversations(legacy_key)
      WHERE legacy_key IS NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
      ON conversation_participants(user_id, conversation_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_created
      ON conversation_messages(conversation_id, created_at ASC, id ASC);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_messages_legacy_message_id
      ON conversation_messages(legacy_message_id)
      WHERE legacy_message_id IS NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_created
      ON conversation_messages(sender_user_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_message_read_state_user_id
      ON message_read_state(user_id, last_read_at DESC);
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (isDatabaseConnectivityError(error)) {
      console.warn(`Messaging conversation schema bootstrap skipped: ${summarizeDatabaseConnectivityError(error)}.`);
      throw error;
    }
    console.error('Messaging conversation schema bootstrap failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { ensureMessagingConversationSchema };
