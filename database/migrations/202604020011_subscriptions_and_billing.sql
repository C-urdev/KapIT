CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subject_type VARCHAR(20) NOT NULL,
  plan_code VARCHAR(40) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month',
  currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
  unit_amount INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (subject_type IN ('user', 'company')),
  CHECK (provider IN ('stripe', 'paypal', 'manual', 'sample')),
  CHECK (status IN ('pending', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired', 'incomplete')),
  CHECK (billing_interval IN ('day', 'week', 'month', 'year', 'one_time')),
  CHECK (unit_amount >= 0),
  CHECK (quantity > 0),
  CHECK (
    (subject_type = 'user' AND owner_user_id IS NOT NULL AND company_id IS NULL)
    OR
    (subject_type = 'company' AND company_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_provider_subscription_key
ON billing_subscriptions(provider, provider_subscription_id)
WHERE provider_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_user_active_plan_key
ON billing_subscriptions(owner_user_id, plan_code)
WHERE subject_type = 'user'
  AND status IN ('pending', 'trialing', 'active', 'past_due', 'incomplete');

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_company_active_plan_key
ON billing_subscriptions(company_id, plan_code)
WHERE subject_type = 'company'
  AND company_id IS NOT NULL
  AND status IN ('pending', 'trialing', 'active', 'past_due', 'incomplete');

CREATE INDEX IF NOT EXISTS billing_subscriptions_status_period_idx
ON billing_subscriptions(status, current_period_end ASC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_subscriptions_owner_status_idx
ON billing_subscriptions(owner_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_subscriptions_company_status_idx
ON billing_subscriptions(company_id, status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_billing_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_billing_subscriptions_updated_at
    BEFORE UPDATE ON billing_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS billing_subscription_events (
  id BIGSERIAL PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  provider_event_id VARCHAR(255),
  event_type VARCHAR(60) NOT NULL,
  event_status VARCHAR(40),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscription_events_provider_event_key
ON billing_subscription_events(provider_event_id)
WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_subscription_events_subscription_created_idx
ON billing_subscription_events(subscription_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  provider_checkout_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (provider IN ('stripe', 'paypal', 'manual', 'sample')),
  CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
  CHECK (amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscription_payments_provider_checkout_key
ON billing_subscription_payments(provider, provider_checkout_id)
WHERE provider_checkout_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscription_payments_provider_payment_key
ON billing_subscription_payments(provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_subscription_payments_subscription_created_idx
ON billing_subscription_payments(subscription_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_subscription_payments_status_created_idx
ON billing_subscription_payments(status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_billing_subscription_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_billing_subscription_payments_updated_at
    BEFORE UPDATE ON billing_subscription_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
