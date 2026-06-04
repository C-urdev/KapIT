const pool = require('../config/database');
const { logger } = require('../config/logger');
const fs = require('fs/promises');
const { getStoredNameFromResumeUrl, getStoredResumePath } = require('./resumeStorageService');
const { ensureResumeSchemaReady } = require('../config/runtimeSchema');

let timer;

const runCleanup = async () => {
  try {
    await ensureResumeSchemaReady();
    await pool.query(
      `UPDATE resume_jobs
       SET status='failed',
           error_message=COALESCE(error_message, 'Timed out'),
           updated_at=CURRENT_TIMESTAMP
       WHERE status IN ('queued','processing')
         AND created_at < CURRENT_TIMESTAMP - INTERVAL '45 minutes'`
    );
    const staleFailed = await pool.query(
      `SELECT id, pdf_url, docx_url
       FROM resumes
       WHERE resume_type='ats_optimized'
         AND processing_status='failed'
         AND created_at < CURRENT_TIMESTAMP - INTERVAL '12 hours'
         AND archived_at IS NULL`
    );
    for (const row of staleFailed.rows) {
      for (const url of [row.pdf_url, row.docx_url]) {
        const storedName = getStoredNameFromResumeUrl(url);
        const absolutePath = getStoredResumePath(storedName);
        if (!absolutePath) continue;
        await fs.unlink(absolutePath).catch(() => {});
      }
    }
    await pool.query(
      `UPDATE resumes
       SET processing_status='archived',
           archived_at=CURRENT_TIMESTAMP,
           updated_at=CURRENT_TIMESTAMP,
           processing_error=COALESCE(processing_error, 'Cleanup archived incomplete resume artifact')
       WHERE resume_type='ats_optimized'
        AND processing_status IN ('pending','processing','failed')
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'`
    );
  } catch (error) {
    if (String(error?.code || '') === '42P01') {
      return;
    }
    logger.warn({ error: error?.message || String(error) }, 'resume.cleanup.failed');
  }
};

const startResumeCleanupJob = () => {
  if (timer) return () => clearInterval(timer);
  const intervalMs = Math.max(60_000, Number(process.env.RESUME_CLEANUP_INTERVAL_MS || 10 * 60_000));
  timer = setInterval(() => {
    void runCleanup();
  }, intervalMs);
  timer.unref?.();
  void runCleanup();
  return () => {
    clearInterval(timer);
    timer = null;
  };
};

module.exports = {
  startResumeCleanupJob,
};
