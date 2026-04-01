ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_user_id UUID,
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID,
  ADD COLUMN IF NOT EXISTS contact_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_sender_user_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_sender_user_id_fkey
      FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_recipient_user_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_recipient_user_id_fkey
      FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_contact_user_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_contact_user_id_fkey
      FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_messages_user_contact_user_time
ON messages(user_id, contact_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_time
ON messages(sender_user_id, recipient_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_sender_time
ON messages(recipient_user_id, sender_user_id, created_at);

UPDATE messages
SET contact_user_id = recipient_user_id
WHERE contact_user_id IS NULL
  AND sender_user_id IS NOT NULL
  AND recipient_user_id IS NOT NULL
  AND user_id = sender_user_id;

UPDATE messages
SET contact_user_id = sender_user_id
WHERE contact_user_id IS NULL
  AND sender_user_id IS NOT NULL
  AND recipient_user_id IS NOT NULL
  AND user_id = recipient_user_id;

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
  );
