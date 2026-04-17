const pool = require('../config/database');

const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due'];
const FREE_COMPANY_ACTIVE_JOB_LIMIT = Number(process.env.FREE_COMPANY_ACTIVE_JOB_LIMIT || 2);

const getTableExists = async (client, tableName) => {
  const result = await client.query('SELECT to_regclass($1) AS table_name', [tableName]);
  return Boolean(result.rows[0]?.table_name);
};

const getPremiumStateForUser = async (client, userId) => {
  const userResult = await client.query(
    `SELECT id, user_type, account_type, is_premium
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (!userResult.rows.length) {
    throw new Error('User not found.');
  }

  const user = userResult.rows[0];
  let hasActiveSubscription = false;

  if (await getTableExists(client, 'billing_subscriptions')) {
    const subscriptionResult = await client.query(
      `SELECT 1
       FROM billing_subscriptions
       WHERE owner_user_id = $1
         AND subject_type = 'user'
         AND status = ANY($2::text[])
       LIMIT 1`,
      [userId, ACTIVE_SUBSCRIPTION_STATUSES]
    );
    hasActiveSubscription = subscriptionResult.rows.length > 0;
  }

  return {
    userId: user.id,
    userType: user.user_type,
    accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
    isPremium: Boolean(user.is_premium || hasActiveSubscription),
    source: hasActiveSubscription ? 'subscription_or_flag' : 'flag',
  };
};

const getPremiumStateForCompanyUser = async (client, userId, companyId = null) => {
  const baseState = await getPremiumStateForUser(client, userId);
  let resolvedCompanyId = companyId || null;

  if (!resolvedCompanyId) {
    const companyResult = await client.query(
      `SELECT id
       FROM companies
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );
    resolvedCompanyId = companyResult.rows[0]?.id || null;
  }

  let hasCompanySubscription = false;
  if (resolvedCompanyId && await getTableExists(client, 'billing_subscriptions')) {
    const subscriptionResult = await client.query(
      `SELECT 1
       FROM billing_subscriptions
       WHERE company_id = $1
         AND subject_type = 'company'
         AND status = ANY($2::text[])
       LIMIT 1`,
      [resolvedCompanyId, ACTIVE_SUBSCRIPTION_STATUSES]
    );
    hasCompanySubscription = subscriptionResult.rows.length > 0;
  }

  return {
    ...baseState,
    companyId: resolvedCompanyId,
    isPremium: Boolean(baseState.isPremium || hasCompanySubscription),
    source: hasCompanySubscription ? 'company_subscription_or_flag' : baseState.source,
  };
};

const getCompanyActiveJobCount = async (client, companyId) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM jobs
     WHERE company_id = $1
       AND status IN ('draft', 'open')`,
    [companyId]
  );
  return Number(result.rows[0]?.count || 0);
};

const assertCompanyCanCreateDraftJob = async (client, { userId, companyId }) => {
  const plan = await getPremiumStateForCompanyUser(client, userId, companyId);
  const activeJobCount = await getCompanyActiveJobCount(client, companyId);
  // Company accounts use pay-per-post publishing, so draft creation should
  // not be blocked by premium tier or draft/open job count limits.
  return {
    ...plan,
    activeJobCount,
    freeCompanyActiveJobLimit: null,
  };
};

const requirePremiumApplicantFeature = (plan, featureLabel = 'This feature') => {
  if (!plan?.isPremium) {
    const error = new Error(`${featureLabel} is available for premium applicants only.`);
    error.statusCode = 403;
    throw error;
  }
};

const requirePremiumEmployerFeature = (plan, featureLabel = 'This feature') => {
  if (!plan?.isPremium) {
    const error = new Error(`${featureLabel} is available for premium employers only.`);
    error.statusCode = 403;
    throw error;
  }
};

const getPlanSnapshotForRequest = async (userId, companyId = null) => {
  const client = await pool.connect();
  try {
    if (companyId || false) {
      return await getPremiumStateForCompanyUser(client, userId, companyId);
    }
    return await getPremiumStateForUser(client, userId);
  } finally {
    client.release();
  }
};

module.exports = {
  FREE_COMPANY_ACTIVE_JOB_LIMIT,
  getPremiumStateForUser,
  getPremiumStateForCompanyUser,
  getCompanyActiveJobCount,
  assertCompanyCanCreateDraftJob,
  requirePremiumApplicantFeature,
  requirePremiumEmployerFeature,
  getPlanSnapshotForRequest,
};
