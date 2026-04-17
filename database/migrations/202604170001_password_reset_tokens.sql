CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  CHECK (expires_at > requested_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash_key
ON password_reset_tokens(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_one_active_per_user_key
ON password_reset_tokens(user_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
ON password_reset_tokens(expires_at);
