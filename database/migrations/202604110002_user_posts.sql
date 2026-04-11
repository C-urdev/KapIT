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
);

CREATE INDEX IF NOT EXISTS idx_user_posts_owner_created
ON user_posts(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_posts_visibility_created
ON user_posts(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_posts_shared_post_id
ON user_posts(shared_post_id);
