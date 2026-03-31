const { normalizeSkills, serializeJobRow } = require('./companyService');

const createDraftJobForCompany = async (client, companyId, draft) => {
  const title = String(draft?.title || '').trim();
  const description = String(draft?.description || '').trim();

  if (!title || !description) {
    throw new Error('Title and description are required.');
  }

  const normalizedSkills = normalizeSkills(draft?.skills);

  const result = await client.query(
    `INSERT INTO jobs (
       company_id,
       title,
       description,
       salary,
       location,
       type,
       skills,
       status,
       posting_payment_status,
       pay_per_use_status,
       published_at,
       active_until
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       'draft',
       'pending',
       'not_due',
       NULL,
       NULL
     )
     RETURNING *`,
    [
      companyId,
      title,
      description,
      draft?.salary ? String(draft.salary).trim() : null,
      draft?.location ? String(draft.location).trim() : null,
      draft?.type ? String(draft.type).trim() : null,
      normalizedSkills,
    ]
  );

  return serializeJobRow(result.rows[0]);
};

const publishDraftJobForCompany = async (client, jobId, companyId, plan, paymentId) => {
  const result = await client.query(
    `UPDATE jobs
     SET status = 'open',
         posting_payment_status = 'paid',
         posting_payment_id = $1::uuid,
         pay_per_use_fee = $2::integer,
         pay_per_use_status = 'not_due',
         posting_plan_id = $3,
         posting_plan_duration = $4,
         posting_plan_duration_days = $5::integer,
         posting_plan_price = $2::integer,
         published_at = CURRENT_TIMESTAMP,
         active_until = CURRENT_TIMESTAMP + ($5::integer * INTERVAL '1 day')
     WHERE id = $6
       AND company_id = $7
     RETURNING *`,
    [
      paymentId,
      plan.price,
      plan.id,
      plan.durationLabel,
      plan.durationDays,
      jobId,
      companyId,
    ]
  );

  if (!result.rows.length) {
    throw new Error('Draft job not found.');
  }

  return serializeJobRow(result.rows[0]);
};

const createPublishedJobForCompany = async (client, companyId, draft, plan, paymentId) => {
  const title = String(draft?.title || '').trim();
  const description = String(draft?.description || '').trim();

  if (!title || !description) {
    throw new Error('Title and description are required.');
  }

  const normalizedSkills = normalizeSkills(draft?.skills);

  const result = await client.query(
    `INSERT INTO jobs (
       company_id,
       title,
       description,
       salary,
       location,
       type,
       skills,
       status,
       pay_per_use_fee,
       pay_per_use_status,
       posting_payment_status,
       posting_payment_id,
       posting_plan_id,
       posting_plan_duration,
       posting_plan_duration_days,
       posting_plan_price,
       published_at,
       active_until
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       'open',
       $8::integer,
       'not_due',
       'paid',
       $9::uuid,
       $10,
       $11,
       $12::integer,
       $8::integer,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP + ($12::integer * INTERVAL '1 day')
     )
     RETURNING *`,
    [
      companyId,
      title,
      description,
      draft?.salary ? String(draft.salary).trim() : null,
      draft?.location ? String(draft.location).trim() : null,
      draft?.type ? String(draft.type).trim() : null,
      normalizedSkills,
      plan.price,
      paymentId,
      plan.id,
      plan.durationLabel,
      plan.durationDays,
    ]
  );

  return serializeJobRow(result.rows[0]);
};

module.exports = {
  createDraftJobForCompany,
  publishDraftJobForCompany,
  createPublishedJobForCompany,
};
