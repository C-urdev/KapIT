CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  purpose VARCHAR(40) NOT NULL DEFAULT 'verify_email',
  token_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (purpose IN ('verify_email', 'change_email')),
  CHECK (status IN ('pending', 'verified', 'expired', 'cancelled')),
  CHECK (expires_at > requested_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS email_verification_tokens_token_hash_key
ON email_verification_tokens(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS email_verification_tokens_one_pending_per_user_key
ON email_verification_tokens(user_id, purpose)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_status_idx
ON email_verification_tokens(user_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_at_idx
ON email_verification_tokens(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  CHECK (expires_at > requested_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash_key
ON password_reset_tokens(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_one_pending_per_user_key
ON password_reset_tokens(user_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_status_idx
ON password_reset_tokens(user_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  message_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  application_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  show_email BOOLEAN NOT NULL DEFAULT FALSE,
  show_phone BOOLEAN NOT NULL DEFAULT FALSE,
  show_location BOOLEAN NOT NULL DEFAULT TRUE,
  show_resume BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (profile_visibility IN ('public', 'authenticated', 'private'))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_user_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
