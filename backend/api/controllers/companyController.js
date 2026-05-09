const pool = require('../config/database');
const { logger } = require('../config/logger');
const { createNotification, ensureNotificationsTable } = require('./notificationsController');
const { ensureBaseUserSchemaReady, ensureHiringSchemaReady, ensureOnboardingSchemaReady } = require('../config/runtimeSchema');
const {
  getOrCreateCompanyForUserId,
  normalizeSkills,
  normalizeRelatedCompanies,
  serializeJobRow,
} = require('../services/companyService');
const { createDraftJobForCompany } = require('../services/jobService');
const { assertCompanyCanCreateDraftJob, getPremiumStateForCompanyUser, requirePremiumEmployerFeature } = require('../services/planAccessService');
const { withJobAvailability, closeExpiredJobs, normalizeDeadlineInput } = require('../services/jobAvailabilityService');
const { isAiConfigured, rankCandidatesForJob } = require('../services/aiService');
const { sendApplicationStatusEmail } = require('../services/emailService');
const { normalizeSocialsText } = require('../utils/socials');

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  profileCompleted: Boolean(user.profile_completed),

  bio: user.bio || '',
  socials: normalizeSocialsText(user.socials),
  profileImage: user.profile_image || '',
  phone: user.phone || '',
  address: user.address || '',

  name: user.name || '',
  education: user.education || '',
  vocationalCourse: user.vocational_course || '',
  desiredJob: user.desired_job || '',
  birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : '',
  age: user.age == null ? '' : String(user.age),
  sex: user.sex || '',

  companyName: user.company_name || '',
  industry: user.industry || '',
  companySize: user.company_size || '',
  website: user.website || '',
  hiringFor: user.hiring_for || '',
});

const getAccountLabel = (row) => row?.company_name || row?.username || row?.email || 'Company';

const upsertApplicantAiScore = async (client, { applicationId, jobId, candidateUserId, score }) => {
  await client.query(
    `INSERT INTO applicant_ai_scores (
       application_id,
       job_id,
       candidate_user_id,
       match_percentage,
       ats_score,
       metadata,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (application_id) DO UPDATE SET
       match_percentage = EXCLUDED.match_percentage,
       ats_score = EXCLUDED.ats_score,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP`,
    [
      applicationId,
      jobId,
      candidateUserId,
      Number(score?.match_percentage || 0),
      Number(score?.ats_score || 0),
      JSON.stringify({
        matchedSkills: score?.matched_skills || [],
        missingSkills: score?.missing_skills || [],
        strengths: score?.strengths || [],
        concerns: score?.concerns || [],
        keywordOverlap: score?.keyword_overlap || [],
      }),
    ]
  );
};

// GET /api/company/profile
const getCompanyProfile = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const profileResult = await client.query(
      `SELECT company_name,
              industry,
              company_size,
              website,
              description,
              location,
              logo_url
       FROM company_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const userResult = await client.query(
      `SELECT email, phone, hiring_for
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const latestProjectResult = await client.query(
      `SELECT title, description, budget, timeline, created_at
       FROM projects
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [company.id]
    );
    const relatedResult = await client.query(
      `SELECT id, name, short_description, website
       FROM company_related_companies
       WHERE company_id = $1
       ORDER BY created_at DESC, name ASC`,
      [company.id]
    );
    const profile = profileResult.rows[0] || null;
    const account = userResult.rows[0] || {};
    const latestProject = latestProjectResult.rows[0] || null;

    return res.json({
      success: true,
      company: {
        ...company,
        onboardingProfile: {
          companyName: profile?.company_name || company.name || '',
          industry: profile?.industry || '',
          companySize: profile?.company_size || '',
          website: profile?.website || company.website || '',
          description: profile?.description || company.description || '',
          location: profile?.location || company.location || '',
          logoUrl: profile?.logo_url || company.logo || '',
          contactEmail: account.email || '',
          phoneNumber: account.phone || '',
          servicesNeeded: String(account.hiring_for || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        latestProject: latestProject
          ? {
              title: latestProject.title || '',
              description: latestProject.description || '',
              budgetRange: latestProject.budget || '',
              timeline: latestProject.timeline || '',
              createdAt: latestProject.created_at,
            }
          : null,
        related_companies: relatedResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          shortDescription: row.short_description || '',
          website: row.website || '',
        })),
      },
    });
  } catch (error) {
    logger.error('Get company profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching company profile' });
  } finally {
    client?.release();
  }
};

// POST /api/company/jobs
const createJob = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'Direct job publishing is disabled. Complete the verified payment flow before publishing a job.',
    });
  } catch (error) {
    logger.error('Create job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating job' });
  }
};

// POST /api/company/jobs/draft
const createDraftJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const plan = await assertCompanyCanCreateDraftJob(client, { userId: req.user.id, companyId: company.id });
    const draftJob = await createDraftJobForCompany(client, company.id, req.body || {});

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      job: withJobAvailability(draftJob),
      plan: {
        isPremium: plan.isPremium,
        freeCompanyActiveJobLimit: plan.freeCompanyActiveJobLimit || null,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Create draft job error:', error);
    return res.status(400).json({ success: false, message: error?.message || 'Server error while creating draft job' });
  } finally {
    client?.release();
  }
};

// GET /api/company/jobs
const getJobs = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await closeExpiredJobs(client);
    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const result = await client.query(
      `SELECT j.*,
              COALESCE(app_counts.applicant_count, 0) AS applicant_count
       FROM jobs j
       LEFT JOIN (
         SELECT job_id, COUNT(*) AS applicant_count
         FROM applications
         GROUP BY job_id
       ) app_counts
       ON app_counts.job_id = j.id
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC`,
      [company.id]
    );

    const plan = await getPremiumStateForCompanyUser(client, req.user.id, company.id);
    return res.json({
      success: true,
      jobs: result.rows.map((row) => withJobAvailability(serializeJobRow(row))),
      plan: {
        isPremium: plan.isPremium,
      },
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching jobs' });
  } finally {
    client?.release();
  }
};

// GET /api/company/applicants
const getApplicants = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await closeExpiredJobs(client);
    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const plan = await getPremiumStateForCompanyUser(client, req.user.id, company.id);

    const result = await client.query(
      `SELECT a.id,
              a.status,
              a.resume_url,
              a.created_at,
              a.updated_at,
              j.id AS job_id,
              j.title AS job_title,
              j.status AS job_status,
              u.id AS user_id,
              u.username,
              u.email,
              u.desired_job,
              u.address,
              u.profile_image,
              score.match_percentage AS ai_match_percentage,
              score.ats_score AS ai_ats_score,
              score.metadata AS ai_metadata
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN applicant_ai_scores score ON score.application_id = a.id
       WHERE j.company_id = $1
       ORDER BY a.created_at DESC
       LIMIT 200`,
      [company.id]
    );

    const applicants = result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      resumeUrl: row.resume_url || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      job: { id: row.job_id, title: row.job_title, status: row.job_status },
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        desiredJob: row.desired_job || '',
        address: row.address || '',
        profileImage: row.profile_image || '',
      },
      ai: plan.isPremium && row.ai_match_percentage != null
        ? {
            matchPercentage: Number(row.ai_match_percentage || 0),
            atsScore: Number(row.ai_ats_score || 0),
            details: row.ai_metadata || {},
          }
        : null,
    }));

    return res.json({
      success: true,
      applicants,
      plan: {
        isPremium: plan.isPremium,
      },
    });
  } catch (error) {
    logger.error('Get applicants error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching applicants' });
  } finally {
    client?.release();
  }
};

// PATCH /api/company/applications/:applicationId/status
const updateApplicantStatus = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const applicationId = Number(req.params.applicationId);
    const status = String(req.body?.status || '').trim().toLowerCase();
    const allowed = new Set(['pending', 'reviewed', 'rejected', 'accepted']);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid application id.' });
    }

    if (!allowed.has(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid application status.' });
    }

    const applicationResult = await client.query(
      `SELECT a.id, a.job_id, a.user_id, a.status, j.company_id, j.status AS job_status, COALESCE(j.hires_needed, 1) AS hires_needed
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = $1 AND j.company_id = $2
       FOR UPDATE OF a, j`,
      [applicationId, company.id]
    );

    if (!applicationResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    const application = applicationResult.rows[0];

    if (status === 'accepted' && application.job_status === 'filled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This job is already filled. Reopen it to hire again.' });
    }
    if (status === 'accepted' && application.job_status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Only open jobs can accept new hires.' });
    }

    if (status === 'accepted' && String(application.status || '').toLowerCase() === 'accepted') {
      const refreshed = await client.query(
        `SELECT a.id,
                a.status,
                a.resume_url,
                a.created_at,
                a.updated_at,
                j.id AS job_id,
                j.title AS job_title,
                j.status AS job_status,
                u.id AS user_id,
                u.username,
                u.email,
                u.desired_job,
                u.address,
                u.profile_image
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = a.user_id
         WHERE a.id = $1`,
        [applicationId]
      );
      await client.query('ROLLBACK');
      const row = refreshed.rows[0];
      return res.json({
        success: true,
        applicant: {
          id: row.id,
          status: row.status,
          resumeUrl: row.resume_url || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          job: { id: row.job_id, title: row.job_title, status: row.job_status },
          user: {
            id: row.user_id,
            username: row.username,
            email: row.email,
            desiredJob: row.desired_job || '',
            address: row.address || '',
            profileImage: row.profile_image || '',
          },
        },
        job: null,
      });
    }

    const actorResult = await client.query(
      `SELECT id, username, email, company_name
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const actorLabel = getAccountLabel(actorResult.rows[0] || {});
    await ensureNotificationsTable(client);

    await client.query(
      `UPDATE applications
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, applicationId]
    );

    let job = null;

    if (status === 'accepted') {
      const acceptedCountResult = await client.query(
        `SELECT COUNT(*)::int AS accepted_count
         FROM applications
         WHERE job_id = $1
           AND status = 'accepted'`,
        [application.job_id]
      );
      const acceptedCount = Number(acceptedCountResult.rows[0]?.accepted_count || 0);
      const hiresNeeded = Math.max(1, Number(application.hires_needed || 1));
      const isFullyHired = acceptedCount >= hiresNeeded;

      const jobResult = await client.query(
        `UPDATE jobs
         SET status = CASE WHEN $1::boolean THEN 'filled' ELSE 'open' END,
             closed_reason = CASE WHEN $1::boolean THEN 'hired' ELSE NULL END,
             pay_per_use_status = CASE WHEN $1::boolean THEN 'due' ELSE pay_per_use_status END,
             filled_application_id = CASE WHEN $1::boolean THEN $2 ELSE NULL END,
             filled_candidate_user_id = CASE WHEN $1::boolean THEN $3 ELSE NULL END,
             closed_at = CASE WHEN $1::boolean THEN CURRENT_TIMESTAMP ELSE NULL END,
             hired_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [isFullyHired, applicationId, application.user_id, application.job_id]
      );
      job = serializeJobRow(jobResult.rows[0]);

      const jobTitle = String(job?.title || 'the role');
      const candidateResult = await client.query(
        `SELECT email, username
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [application.user_id]
      );

      await createNotification(client, {
        userId: application.user_id,
        actorUserId: req.user.id,
        type: 'application_status',
        title: 'Application accepted',
        message: isFullyHired
          ? `${actorLabel} hired you for ${jobTitle}.`
          : `${actorLabel} hired you for ${jobTitle}. (${acceptedCount}/${hiresNeeded} hired)`,
        metadata: {
          actorLabel,
          status: 'accepted',
          jobTitle,
          eventAt: new Date().toISOString(),
          acceptedCount,
          hiresNeeded,
        },
      });

      await sendApplicationStatusEmail({
        to: candidateResult.rows[0]?.email || '',
        candidateName: candidateResult.rows[0]?.username || '',
        jobTitle,
        companyLabel: actorLabel,
        status: 'accepted',
      }).catch(() => null);

      if (isFullyHired) {
        const autoRejected = await client.query(
          `UPDATE applications
           SET status = 'rejected',
               updated_at = CURRENT_TIMESTAMP
           WHERE job_id = $1
             AND id <> $2
             AND status NOT IN ('accepted', 'rejected')
           RETURNING id`,
          [application.job_id, applicationId]
        );

        const autoRejectedIds = autoRejected.rows
          .map((item) => Number(item.id))
          .filter((id) => Number.isInteger(id) && id > 0);

        if (autoRejectedIds.length) {
          const affectedApplicants = await client.query(
            `SELECT a.id, a.user_id, j.title AS job_title, u.email, u.username
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             JOIN users u ON u.id = a.user_id
             WHERE a.id = ANY($1::bigint[])`,
            [autoRejectedIds]
          );

          for (const item of affectedApplicants.rows) {
            await createNotification(client, {
              userId: item.user_id,
              actorUserId: req.user.id,
              type: 'application_status',
              title: 'Application update',
              message: `${actorLabel} updated your application for ${item.job_title} to rejected.`,
              metadata: {
                actorLabel,
                status: 'rejected',
                jobTitle: item.job_title,
                eventAt: new Date().toISOString(),
              },
            });

            await sendApplicationStatusEmail({
              to: item.email,
              candidateName: item.username,
              jobTitle: item.job_title,
              companyLabel: actorLabel,
              status: 'rejected',
            }).catch(() => null);
          }
        }
      }
    }

    if (status !== 'accepted') {
      const jobTitleResult = await client.query('SELECT title FROM jobs WHERE id = $1 LIMIT 1', [application.job_id]);
      const jobTitle = jobTitleResult.rows[0]?.title || 'the role';
      await createNotification(client, {
        userId: application.user_id,
        actorUserId: req.user.id,
        type: 'application_status',
        title: status === 'reviewed' ? 'Application reviewed' : 'Application update',
        message:
          status === 'reviewed'
            ? `${actorLabel} reviewed your application for ${jobTitle}.`
            : `${actorLabel} updated your application for ${jobTitle} to ${status}.`,
        metadata: {
          actorLabel,
          status,
          jobTitle,
          eventAt: new Date().toISOString(),
        },
      });

      const candidateResult = await client.query(
        `SELECT email, username
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [application.user_id]
      );
      await sendApplicationStatusEmail({
        to: candidateResult.rows[0]?.email || '',
        candidateName: candidateResult.rows[0]?.username || '',
        jobTitle,
        companyLabel: actorLabel,
        status,
      }).catch(() => null);
    }

    const refreshed = await client.query(
      `SELECT a.id,
              a.status,
              a.resume_url,
              a.created_at,
              a.updated_at,
              j.id AS job_id,
              j.title AS job_title,
              j.status AS job_status,
              u.id AS user_id,
              u.username,
              u.email,
              u.desired_job,
              u.address,
              u.profile_image
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1`,
      [applicationId]
    );

    await client.query('COMMIT');
    const row = refreshed.rows[0];
    return res.json({
      success: true,
      applicant: {
        id: row.id,
        status: row.status,
        resumeUrl: row.resume_url || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        job: { id: row.job_id, title: row.job_title, status: row.job_status },
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
          desiredJob: row.desired_job || '',
          address: row.address || '',
          profileImage: row.profile_image || '',
        },
      },
      job,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Update applicant status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating applicant status' });
  } finally {
    client?.release();
  }
};

// PATCH /api/company/jobs/:jobId/status
const updateJobStatus = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const jobId = Number(req.params.jobId);
    const status = String(req.body?.status || '').trim().toLowerCase();
    const allowed = new Set(['open', 'closed']);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    if (!allowed.has(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid job status.' });
    }

    const existing = await client.query('SELECT * FROM jobs WHERE id = $1 AND company_id = $2', [jobId, company.id]);
    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const nextReason = status === 'closed' ? 'manual' : null;
    const result = await client.query(
      `UPDATE jobs
       SET status = $1::text,
           closed_reason = $2::text,
           closed_at = CASE WHEN $1::text = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END,
           hired_at = CASE WHEN $1::text = 'open' THEN NULL ELSE hired_at END,
           filled_application_id = CASE WHEN $1::text = 'open' THEN NULL ELSE filled_application_id END,
           filled_candidate_user_id = CASE WHEN $1::text = 'open' THEN NULL ELSE filled_candidate_user_id END,
           pay_per_use_status = CASE
             WHEN $1::text = 'open' AND pay_per_use_status <> 'paid' THEN 'not_due'
             ELSE pay_per_use_status
           END
       WHERE id = $3
       RETURNING *`,
      [status, nextReason, jobId]
    );

    if (status === 'open') {
      await client.query(
        `UPDATE applications
         SET status = CASE WHEN status = 'rejected' THEN 'pending' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE job_id = $1`,
        [jobId]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, job: serializeJobRow(result.rows[0]) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Update job status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating job status' });
  } finally {
    client?.release();
  }
};

// POST /api/company/jobs/:jobId/reopen
const reopenJob = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: 'Direct job reopening is disabled. Reopen the posting through the verified payment flow.',
    });
  } catch (error) {
    logger.error('Reopen job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while reopening job' });
  }
};

// DELETE /api/company/jobs/:jobId
const deleteJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const jobId = Number(req.params.jobId);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    const existing = await client.query('SELECT id, title FROM jobs WHERE id = $1 AND company_id = $2', [jobId, company.id]);
    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const deleted = existing.rows[0];
    await client.query('DELETE FROM jobs WHERE id = $1 AND company_id = $2', [jobId, company.id]);

    await client.query('COMMIT');
    return res.json({
      success: true,
      deletedJob: {
        id: deleted.id,
        title: deleted.title,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Delete job error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting job' });
  } finally {
    client?.release();
  }
};

// GET /api/company/developers?q=...
const getDevelopers = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    await ensureOnboardingSchemaReady();
    const q = String(req.query.q || '').trim();
    const skill = String(req.query.skill || '').trim();
    const location = String(req.query.location || '').trim();
    const jobId = req.query.jobId == null ? null : Number(req.query.jobId);
    const minExperienceRaw = String(req.query.minExperience || '').trim();
    const minExperience = minExperienceRaw === '' ? null : Number(minExperienceRaw);

    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const plan = await getPremiumStateForCompanyUser(client, req.user.id, company.id);

    if (!plan.isPremium && (skill || location || Number.isFinite(minExperience))) {
      return res.status(403).json({
        success: false,
        message: 'Advanced developer filters are available for premium employers only.',
      });
    }

    const conditions = [`u.user_type = 'employee'`, `u.profile_completed = true`];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      conditions.push(
        `(u.username ILIKE $${idx} OR u.email ILIKE $${idx} OR u.desired_job ILIKE $${idx} OR u.education ILIKE $${idx} OR u.address ILIKE $${idx} OR dp.full_name ILIKE $${idx} OR dp.job_title ILIKE $${idx} OR dp.preferred_it_role ILIKE $${idx})`
      );
    }

    if (location) {
      values.push(`%${location}%`);
      const idx = values.length;
      conditions.push(`(u.address ILIKE $${idx} OR dp.location ILIKE $${idx})`);
    }

    if (Number.isFinite(minExperience)) {
      values.push(Math.max(0, Math.trunc(minExperience)));
      const idx = values.length;
      conditions.push(`COALESCE(dp.experience_years, 0) >= $${idx}`);
    }

    if (skill) {
      values.push(`%${skill}%`);
      const idx = values.length;
      conditions.push(
        `EXISTS (SELECT 1 FROM unnest(COALESCE(dp.skills, ARRAY[]::TEXT[])) AS s WHERE s ILIKE $${idx})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await client.query(
      `SELECT u.id,
              u.username,
              u.email,
              u.desired_job,
              u.education,
              u.address,
              u.socials,
              u.profile_image,
              u.is_premium,
              dp.experience_years,
              dp.skills,
              COALESCE(dp.location, u.address) AS profile_location
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       ${where}
       ORDER BY u.is_premium DESC, u.username ASC
       LIMIT 36`,
      values
    );

    const developers = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      desiredJob: row.desired_job || '',
      education: row.education || '',
      address: row.profile_location || row.address || '',
      socials: normalizeSocialsText(row.socials),
      profileImage: row.profile_image || '',
      isPremium: row.is_premium,
      experienceYears: row.experience_years == null ? null : row.experience_years,
      skills: Array.isArray(row.skills) ? row.skills : [],
      aboutMe: '',
    }));

    if (plan.isPremium && isAiConfigured() && Number.isInteger(jobId) && jobId > 0 && developers.length) {
      const jobResult = await client.query(
        `SELECT id, title, description, location, type, skills
         FROM jobs
         WHERE id = $1
           AND company_id = $2
         LIMIT 1`,
        [jobId, company.id]
      );

      if (jobResult.rows.length) {
        const aiResult = await rankCandidatesForJob({
          job: jobResult.rows[0],
          candidates: developers.map((developer) => ({
            id: developer.id,
            username: developer.username,
            desiredJob: developer.desiredJob,
            address: developer.address,
            skills: developer.skills,
          })),
        }).catch(() => null);

        const rankingMap = new Map((aiResult?.rankings || []).map((item) => [String(item.candidate_id), item]));
        for (const developer of developers) {
          const ranking = rankingMap.get(String(developer.id));
          if (ranking) {
            developer.ai = {
              matchPercentage: Number(ranking.match_percentage || 0),
              atsScore: Number(ranking.ats_score || 0),
              details: {
                matchedSkills: ranking.matched_skills || [],
                missingSkills: ranking.missing_skills || [],
                strengths: ranking.strengths || [],
                concerns: ranking.concerns || [],
              },
            };
          }
        }

        developers.sort((left, right) => Number(right?.ai?.matchPercentage || 0) - Number(left?.ai?.matchPercentage || 0));
      }
    }

    return res.json({
      success: true,
      developers,
      plan: {
        isPremium: plan.isPremium,
      },
    });
  } catch (error) {
    logger.error('Get developers error:', error);
    return res.status(500).json({ success: false, message: 'Server error while searching developers' });
  } finally {
    client?.release();
  }
};

// GET /api/company/jobs/:jobId/ai/rank-applicants
const rankApplicantsForJob = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const plan = await getPremiumStateForCompanyUser(client, req.user.id, company.id);
    requirePremiumEmployerFeature(plan, 'Applicant AI ranking');

    if (!isAiConfigured()) {
      return res.status(503).json({ success: false, message: 'AI service is not configured.' });
    }

    const jobId = Number(req.params.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    const jobResult = await client.query(
      `SELECT id, title, description, location, type, skills
       FROM jobs
       WHERE id = $1
         AND company_id = $2
       LIMIT 1`,
      [jobId, company.id]
    );

    if (!jobResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const applicantsResult = await client.query(
      `SELECT a.id AS application_id,
              a.user_id,
              u.username,
              u.email,
              u.desired_job,
              u.address,
              COALESCE(dp.bio, u.bio, '') AS bio,
              COALESCE(dp.resume_url, '') AS resume_url,
              COALESCE(dp.skills, ARRAY[]::text[]) AS skills,
              COALESCE(dp.experience_years, 0) AS experience_years
       FROM applications a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [jobId]
    );

    const aiResult = await rankCandidatesForJob({
      job: jobResult.rows[0],
      candidates: applicantsResult.rows.map((row) => ({
        id: row.user_id,
        username: row.username,
        desiredJob: row.desired_job,
        bio: row.bio,
        resume: row.resume_url,
        address: row.address,
        skills: row.skills,
        yearsOfExperience: row.experience_years,
      })),
    });

    const rankingMap = new Map((aiResult?.rankings || []).map((item) => [String(item.candidate_id), item]));
    const rankings = [];

    for (const applicant of applicantsResult.rows) {
      const score = rankingMap.get(String(applicant.user_id));
      if (!score) {
        continue;
      }

      await upsertApplicantAiScore(client, {
        applicationId: applicant.application_id,
        jobId,
        candidateUserId: applicant.user_id,
        score,
      }).catch(() => null);

      rankings.push({
        applicationId: applicant.application_id,
        candidateUserId: applicant.user_id,
        candidateName: applicant.username || applicant.email || 'Candidate',
        matchPercentage: Number(score.match_percentage || 0),
        atsScore: Number(score.ats_score || 0),
        details: {
          matchedSkills: score.matched_skills || [],
          missingSkills: score.missing_skills || [],
          strengths: score.strengths || [],
          concerns: score.concerns || [],
        },
      });
    }

    rankings.sort((left, right) => right.matchPercentage - left.matchPercentage);
    return res.json({ success: true, rankings });
  } catch (error) {
    logger.error('Rank applicants for job error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error?.message || 'Server error while ranking applicants.',
    });
  } finally {
    client?.release();
  }
};

// GET /api/company/analytics
const getAnalytics = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const jobsResult = await client.query('SELECT COUNT(*)::int AS count FROM jobs WHERE company_id = $1', [company.id]);
    const jobsByStatusResult = await client.query(
      `SELECT status, COUNT(*)::int AS count
       FROM jobs
       WHERE company_id = $1
       GROUP BY status`,
      [company.id]
    );
    const appsResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.company_id = $1`,
      [company.id]
    );

    const statusResult = await client.query(
      `SELECT a.status, COUNT(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE j.company_id = $1
       GROUP BY a.status`,
      [company.id]
    );

    const byStatus = {};
    statusResult.rows.forEach((row) => {
      byStatus[row.status] = row.count;
    });

    return res.json({
      success: true,
      analytics: {
        totalJobs: jobsResult.rows[0]?.count || 0,
        totalApplicants: appsResult.rows[0]?.count || 0,
        jobsByStatus: jobsByStatusResult.rows.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        applicantsByStatus: byStatus,
      },
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching analytics' });
  } finally {
    client?.release();
  }
};

// PUT /api/company/profile
const updateCompanyProfile = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const company = await getOrCreateCompanyForUserId(client, req.user.id);
    const { name, logo, shortDescription, description, location, website, relatedCompanies } = req.body || {};

    const nextName = String(name || '').trim();
    if (!nextName) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const result = await client.query(
      `UPDATE companies
       SET name = $1,
           logo = $2,
           short_description = $3,
           description = $4,
           location = $5,
           website = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        nextName,
        logo ? String(logo) : null,
        shortDescription ? String(shortDescription) : null,
        description ? String(description) : null,
        location ? String(location) : null,
        website ? String(website) : null,
        company.id,
      ]
    );

    const nextRelatedCompanies = normalizeRelatedCompanies(relatedCompanies);
    await client.query('DELETE FROM company_related_companies WHERE company_id = $1', [company.id]);
    for (const item of nextRelatedCompanies) {
      await client.query(
        `INSERT INTO company_related_companies (company_id, name, short_description, website)
         VALUES ($1, $2, $3, $4)`,
        [company.id, item.name, item.shortDescription || null, item.website || null]
      );
    }

    // Mirror key fields into users table for public profile compatibility.
    await client.query(
      `UPDATE users
       SET company_name = $1,
           profile_image = COALESCE($2, profile_image),
           bio = COALESCE($3, bio),
           address = COALESCE($4, address),
           website = COALESCE($5, website)
       WHERE id = $6`,
      [
        nextName,
        logo ? String(logo) : null,
        shortDescription ? String(shortDescription) : description ? String(description) : null,
        location ? String(location) : null,
        website ? String(website) : null,
        req.user.id,
      ]
    );

    await client.query('COMMIT');
    return res.json({
      success: true,
      company: {
        ...result.rows[0],
        related_companies: nextRelatedCompanies,
      },
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Update company profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating profile' });
  } finally {
    client?.release();
  }
};

// PUT /api/company/onboarding/profile
const updateCompanyOnboardingProfile = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureHiringSchemaReady();
    await ensureOnboardingSchemaReady();
    client = await pool.connect();
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!currentResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const body = req.body || {};
    const companyName = String(body.companyName || '').trim();
    const industry = String(body.industry || '').trim();
    const companySize = String(body.companySize || '').trim();
    const location = String(body.location || '').trim();
    const website = String(body.website || '').trim();
    const description = String(body.description || '').trim();
    const logoUrl = body.logoUrl ? String(body.logoUrl) : '';
    const phoneNumber = String(body.phoneNumber || '').trim();

    if (!companyName || !industry || !companySize || !location) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Please fill in the required fields.' });
    }

    const company = await getOrCreateCompanyForUserId(client, req.user.id);

    const companyResult = await client.query(
      `UPDATE companies
       SET name = $1,
           logo = CASE WHEN $2 = '' THEN logo ELSE $2 END,
           description = $3,
           location = $4,
           website = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [companyName, logoUrl, description || null, location || null, website || null, company.id]
    );

    await client.query(
      `INSERT INTO company_profiles (
         user_id,
         company_name,
         industry,
         company_size,
         website,
         description,
         location,
         logo_url,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         industry = EXCLUDED.industry,
         company_size = EXCLUDED.company_size,
         website = EXCLUDED.website,
         description = EXCLUDED.description,
         location = EXCLUDED.location,
         logo_url = EXCLUDED.logo_url,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, companyName, industry, companySize, website || null, description || null, location || null, logoUrl || null]
    );

    const servicesNeeded = Array.isArray(body.servicesNeeded) ? body.servicesNeeded.map((s) => String(s).trim()).filter(Boolean).slice(0, 20) : [];

    await client.query(
      `UPDATE users
       SET company_name = $1,
           industry = $2,
           company_size = $3,
           website = $4,
           bio = $5,
           address = $6,
           profile_image = CASE WHEN $7 = '' THEN profile_image ELSE $7 END,
           phone = $8,
           hiring_for = $9,
           account_type = COALESCE(account_type, 'company'),
           profile_completed = true
       WHERE id = $10`,
      [
        companyName,
        industry,
        companySize,
        website || null,
        description || null,
        location || null,
        logoUrl,
        phoneNumber || null,
        servicesNeeded.join(', '),
        req.user.id,
      ]
    );

    const projectTitle = String(body.projectTitle || '').trim();
    const projectDescription = String(body.projectDescription || '').trim();
    const budgetRange = String(body.budgetRange || '').trim();
    const timeline = String(body.timeline || '').trim();

    let project = null;
    if (projectTitle && projectDescription) {
      const projectResult = await client.query(
        `INSERT INTO projects (company_id, title, description, budget, timeline, status)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [company.id, projectTitle, projectDescription, budgetRange || null, timeline || null, 'open']
      );
      project = projectResult.rows[0];
    }

    const nextUserResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    await client.query('COMMIT');
    return res.json({
      success: true,
      user: serializeUser(nextUserResult.rows[0]),
      company: companyResult.rows[0],
      project,
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Update company onboarding profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving profile' });
  } finally {
    client?.release();
  }
};

module.exports = {
  getCompanyProfile,
  createJob,
  createDraftJob,
  getJobs,
  getApplicants,
  updateApplicantStatus,
  updateJobStatus,
  reopenJob,
  deleteJob,
  getDevelopers,
  rankApplicantsForJob,
  getAnalytics,
  updateCompanyProfile,
  updateCompanyOnboardingProfile,
};
