const { normalizeSkills, serializeJobRow } = require('./companyService');
const { normalizeDeadlineInput } = require('./jobAvailabilityService');

const normalizePreAssessmentDraft = (draft) => {
  const source = draft?.preAssessment && typeof draft.preAssessment === 'object' ? draft.preAssessment : {};
  const enabled = Boolean(source.enabled);
  const instructions = String(source.instructions || '').trim().slice(0, 2000);
  const questions = Array.isArray(source.questions)
    ? source.questions
      .map((entry, index) => {
        const question = String(entry?.question || '').trim();
        const imageUrl = String(entry?.imageUrl || '').trim();
        const criteria = Array.isArray(entry?.criteria)
          ? entry.criteria.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 20)
          : [];

        if (!question) {
          return null;
        }

        return {
          id: String(entry?.id || `q${index + 1}`).trim().slice(0, 80) || `q${index + 1}`,
          question: question.slice(0, 1000),
          imageUrl: imageUrl.slice(0, 2000000),
          criteria,
        };
      })
      .filter(Boolean)
      .slice(0, 12)
    : [];

  return {
    enabled,
    instructions,
    questions: enabled ? questions : [],
  };
};

const normalizeHiringWorkflowDraft = (draft) => ({
  ats: String(draft?.ats || '').trim().slice(0, 160),
  hiringTimeline: String(draft?.hiringTimeline || '').trim().slice(0, 160),
  mustHaves: String(draft?.mustHaves || '').trim().slice(0, 2000),
  dealbreakers: String(draft?.dealbreakers || '').trim().slice(0, 2000),
});

const buildJobDraftPayload = (draft) => ({
  hiringWorkflow: normalizeHiringWorkflowDraft(draft),
  preAssessment: normalizePreAssessmentDraft(draft),
});

const createDraftJobForCompany = async (client, companyId, draft) => {
  const title = String(draft?.title || '').trim();
  const description = String(draft?.description || '').trim();

  if (!title || !description) {
    throw new Error('Title and description are required.');
  }

  const normalizedSkills = normalizeSkills(draft?.skills);
  const hiresNeeded = Math.max(1, Math.min(50, Number(draft?.hiresNeeded || 1) || 1));
  const applicationDeadline = normalizeDeadlineInput(draft?.applicationDeadline);

  const draftPayload = buildJobDraftPayload(draft);

  const result = await client.query(
    `INSERT INTO jobs (
       company_id,
       title,
       description,
       salary,
       location,
       type,
       experience_level,
       work_preference,
       skills,
       status,
       posting_payment_status,
       pay_per_use_status,
       published_at,
       active_until,
       application_deadline,
       hires_needed,
       draft_payload
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       'draft',
       'pending',
       'not_due',
       NULL,
       NULL,
       $10::timestamptz,
       $11::integer,
       $12::jsonb
     )
     RETURNING *`,
    [
      companyId,
      title,
      description,
      draft?.salary ? String(draft.salary).trim() : null,
      draft?.location ? String(draft.location).trim() : null,
      draft?.type ? String(draft.type).trim() : null,
      draft?.experienceLevel ? String(draft.experienceLevel).trim().toLowerCase() : null,
      draft?.workPreference ? String(draft.workPreference).trim().toLowerCase() : null,
      normalizedSkills,
      applicationDeadline,
      hiresNeeded,
      JSON.stringify(draftPayload),
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
         active_until = CURRENT_TIMESTAMP + ($5::integer * INTERVAL '1 day'),
         application_deadline = COALESCE(application_deadline, $8::timestamptz)
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
      normalizeDeadlineInput(plan?.applicationDeadline),
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
  const hiresNeeded = Math.max(1, Math.min(50, Number(draft?.hiresNeeded || 1) || 1));
  const applicationDeadline = normalizeDeadlineInput(draft?.applicationDeadline);
  const draftPayload = buildJobDraftPayload(draft);

  const result = await client.query(
    `INSERT INTO jobs (
       company_id,
       title,
       description,
       salary,
       location,
       type,
       experience_level,
       work_preference,
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
       active_until,
       application_deadline,
       hires_needed,
       draft_payload
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       'open',
       $10::integer,
       'not_due',
       'paid',
       $11::uuid,
       $12,
       $13,
       $14::integer,
       $10::integer,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP + ($14::integer * INTERVAL '1 day'),
       $15::timestamptz,
       $16::integer,
       $17::jsonb
     )
     RETURNING *`,
    [
      companyId,
      title,
      description,
      draft?.salary ? String(draft.salary).trim() : null,
      draft?.location ? String(draft.location).trim() : null,
      draft?.type ? String(draft.type).trim() : null,
      draft?.experienceLevel ? String(draft.experienceLevel).trim().toLowerCase() : null,
      draft?.workPreference ? String(draft.workPreference).trim().toLowerCase() : null,
      normalizedSkills,
      plan.price,
      paymentId,
      plan.id,
      plan.durationLabel,
      plan.durationDays,
      applicationDeadline,
      hiresNeeded,
      JSON.stringify(draftPayload),
    ]
  );

  return serializeJobRow(result.rows[0]);
};

module.exports = {
  normalizePreAssessmentDraft,
  normalizeHiringWorkflowDraft,
  buildJobDraftPayload,
  createDraftJobForCompany,
  publishDraftJobForCompany,
  createPublishedJobForCompany,
};
