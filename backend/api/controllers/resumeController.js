const fs = require('fs/promises');
const { logger } = require('../config/logger');
const pool = require('../config/database');
const { getStoredNameFromResumeUrl, getStoredResumePath, getResumeDownloadName } = require('../services/resumeStorageService');
const {
  signDownload,
  verifyDownload,
  createOriginalResume,
  createResumeJob,
  listUserVisibleResume,
} = require('../services/resumeService');
const { enqueueAtsOptimization } = require('../queues/resumeQueue');
const { onResumeJobEvent } = require('../services/resumeJobEvents');

const uploadResume = async (req, res) => {
  try {
    const contentType = String(req.get('content-type') || '').toLowerCase().split(';')[0].trim();
    const originalName = String(req.get('x-upload-filename') || 'resume.pdf').trim();
    const resume = await createOriginalResume({ userId: req.user.id, buffer: req.body, originalName, contentType });
    return res.status(201).json({ success: true, resume });
  } catch (error) {
    logger.error('resume.upload.failed', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error?.message || 'Upload failed' });
  }
};

const optimizeResume = async (req, res) => {
  try {
    const resumeId = String(req.params.id || '').trim();
    const check = await pool.query(`SELECT id FROM resumes WHERE id=$1 AND user_id=$2 AND archived_at IS NULL LIMIT 1`, [resumeId, req.user.id]);
    if (!check.rows.length) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }
    const job = await createResumeJob({ userId: req.user.id, resumeId });
    const queued = await enqueueAtsOptimization({ jobId: job.id, userId: req.user.id, sourceResumeId: resumeId });
    if (!queued) {
      const { runAtsOptimizationJob } = require('../services/resumeService');
      void runAtsOptimizationJob({ jobId: job.id, userId: req.user.id, sourceResumeId: resumeId });
    }
    return res.status(202).json({ success: true, jobId: job.id });
  } catch (error) {
    logger.error('resume.optimize.failed', error);
    return res.status(500).json({ success: false, message: error?.message || 'Failed to queue optimization job.' });
  }
};

const getResumeJob = async (req, res) => {
  const jobId = String(req.params.jobId || '').trim();
  const result = await pool.query(
    `SELECT j.*, r.resume_type AS result_resume_type, r.pdf_url AS result_pdf_url, r.docx_url AS result_docx_url, r.ats_data_json, r.ats_score
     FROM resume_jobs j
     LEFT JOIN resumes r ON r.id = j.result_resume_id
     WHERE j.id = $1 AND j.user_id = $2
     LIMIT 1`,
    [jobId, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Job not found.' });
  return res.json({ success: true, job: result.rows[0] });
};

const getResume = async (req, res) => {
  const resumeId = String(req.params.resumeId || '').trim();
  const item = await listUserVisibleResume({ resumeId, requester: req.user || null });
  if (!item) return res.status(404).json({ success: false, message: 'Resume not found.' });
  if (item.forbidden) return res.status(403).json({ success: false, message: 'Forbidden' });
  const pdfSigned = item.pdf_url ? signDownload({ resumeId: item.id, fileKind: 'pdf', userId: req.user?.id || 'public' }) : null;
  const docxSigned = item.docx_url ? signDownload({ resumeId: item.id, fileKind: 'docx', userId: req.user?.id || 'public' }) : null;
  return res.json({
    success: true,
    resume: {
      ...item,
      signed_pdf_url: pdfSigned ? `/api/resumes/${item.id}/file/pdf?exp=${pdfSigned.exp}&sig=${pdfSigned.sig}` : null,
      signed_docx_url: docxSigned ? `/api/resumes/${item.id}/file/docx?exp=${docxSigned.exp}&sig=${docxSigned.sig}` : null,
    },
  });
};

const patchResume = async (req, res) => {
  const resumeId = String(req.params.resumeId || '').trim();
  const body = req.body || {};
  const fields = [];
  const values = [];
  if (typeof body.is_public === 'boolean') {
    fields.push(`is_public = $${fields.length + 3}`);
    values.push(body.is_public);
  }
  if (typeof body.visibility_scope === 'string') {
    fields.push(`visibility_scope = $${fields.length + 3}`);
    values.push(body.visibility_scope);
  }
  if (typeof body.original_filename === 'string') {
    fields.push(`original_filename = $${fields.length + 3}`);
    values.push(body.original_filename.trim());
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (body.is_primary === true) {
      const row = await client.query(`SELECT resume_type FROM resumes WHERE id=$1 AND user_id=$2`, [resumeId, req.user.id]);
      const resumeType = row.rows[0]?.resume_type;
      if (!resumeType) throw Object.assign(new Error('Resume not found'), { statusCode: 404 });
      await client.query(`UPDATE resumes SET is_primary=FALSE WHERE user_id=$1 AND resume_type=$2`, [req.user.id, resumeType]);
      
      fields.push(`is_primary = $${fields.length + 3}`);
      values.push(true);
    }
    const query = `UPDATE resumes SET ${fields.join(', ') || 'updated_at = updated_at'}, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 AND archived_at IS NULL RETURNING *`;
    const result = await client.query(query, [resumeId, req.user.id, ...values]);
    if (!result.rows.length) throw Object.assign(new Error('Resume not found'), { statusCode: 404 });
    await client.query('COMMIT');
    return res.json({ success: true, resume: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(error.statusCode || 500).json({ success: false, message: error?.message || 'Failed to update resume' });
  } finally {
    client.release();
  }
};

const deleteResume = async (req, res) => {
  const resumeId = String(req.params.resumeId || '').trim();
  const result = await pool.query(
    `UPDATE resumes SET processing_status='archived', archived_at=CURRENT_TIMESTAMP, is_primary=FALSE, updated_at=CURRENT_TIMESTAMP
     WHERE id=$1 AND user_id=$2 AND archived_at IS NULL RETURNING id`,
    [resumeId, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Resume not found.' });
  return res.json({ success: true });
};

const streamSignedResumeFile = async (req, res) => {
  const resumeId = String(req.params.resumeId || '').trim();
  const fileKind = String(req.params.fileKind || '').trim().toLowerCase();
  const exp = req.query.exp;
  const sig = req.query.sig;
  const allowed = verifyDownload({ resumeId, fileKind, userId: req.user?.id || 'public', exp, sig });
  if (!allowed) return res.status(403).json({ success: false, message: 'Invalid or expired link.' });
  const visibility = await listUserVisibleResume({ resumeId, requester: req.user || null });
  if (!visibility || visibility.forbidden) return res.status(403).json({ success: false, message: 'Forbidden' });
  const row = visibility;
  if (!row) return res.status(404).json({ success: false, message: 'Resume not found.' });
  const resumeUrl = fileKind === 'pdf' ? row.pdf_url : row.docx_url;
  const storedName = getStoredNameFromResumeUrl(resumeUrl);
  const absolutePath = getStoredResumePath(storedName);
  if (!absolutePath) return res.status(404).json({ success: false, message: 'File missing.' });
  await fs.access(absolutePath);
  res.setHeader('Content-Disposition', `inline; filename="${getResumeDownloadName(storedName)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(absolutePath);
};

const streamResumeJobEvents = async (req, res) => {
  const jobId = String(req.params.jobId || '').trim();
  const own = await pool.query(`SELECT id, status, current_step, progress_percent, error_message, result_resume_id FROM resume_jobs WHERE id=$1 AND user_id=$2 LIMIT 1`, [jobId, req.user.id]);
  if (!own.rows.length) return res.status(404).json({ success: false, message: 'Job not found.' });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const push = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  push({ status: own.rows[0].status, step: own.rows[0].current_step, progress: own.rows[0].progress_percent, error: own.rows[0].error_message, resultResumeId: own.rows[0].result_resume_id });
  const off = onResumeJobEvent(jobId, push);
  const timer = setInterval(async () => {
    const poll = await pool.query(`SELECT status, current_step, progress_percent, error_message, result_resume_id FROM resume_jobs WHERE id=$1`, [jobId]).catch(() => null);
    if (poll?.rows?.[0]) push({ status: poll.rows[0].status, step: poll.rows[0].current_step, progress: poll.rows[0].progress_percent, error: poll.rows[0].error_message, resultResumeId: poll.rows[0].result_resume_id });
  }, 10000);
  req.on('close', () => {
    clearInterval(timer);
    off();
  });
};

module.exports = {
  uploadResume,
  optimizeResume,
  getResumeJob,
  getResume,
  patchResume,
  deleteResume,
  streamSignedResumeFile,
  streamResumeJobEvents,
};
