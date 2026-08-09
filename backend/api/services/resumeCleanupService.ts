const pool = require('../config/database');
const { isDatabaseConnectivityError, summarizeDatabaseConnectivityError } = require('../config/database');
const { logger } = require('../config/logger');
const fs = require('fs/promises');
const { getStoredNameFromResumeUrl, getStoredResumePath } = require('./resumeStorageService');
const { ensureResumeSchemaReady } = require('../config/runtimeSchema');
const { getR2Client, getR2BucketName, isR2Enabled } = require('../config/r2');
const { ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

let timer;
const CLEANUP_DB_WARN_COOLDOWN_MS = Number(process.env.RESUME_CLEANUP_DB_WARN_COOLDOWN_MS || 30000);
let lastCleanupDbWarningAt = 0;

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

    if (isR2Enabled()) {
      const client = getR2Client();
      const bucket = getR2BucketName();

      let isTruncated = true;
      let continuationToken = undefined;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      while (isTruncated) {
        const listRes = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: 'uploads/',
            ContinuationToken: continuationToken,
          })
        );

        const contents = listRes.Contents || [];
        const oldObjects = contents.filter((obj) => obj.LastModified && obj.LastModified < twentyFourHoursAgo);

        if (oldObjects.length > 0) {
          const keys = oldObjects.map((o) => o.Key);
          const chunkSize = 100;
          for (let i = 0; i < keys.length; i += chunkSize) {
            const chunk = keys.slice(i, i + chunkSize);
            const { rows } = await pool.query(
              `SELECT r2_object_key FROM resumes WHERE r2_object_key = ANY($1)`,
              [chunk]
            );

            const referencedKeys = new Set(rows.map((r) => r.r2_object_key));
            const toDelete = chunk.filter((k) => !referencedKeys.has(k)).map((k) => ({ Key: k }));

            if (toDelete.length > 0) {
              await Promise.all(
                toDelete.map((obj) =>
                  client.send(
                    new DeleteObjectCommand({
                      Bucket: bucket,
                      Key: obj.Key,
                    })
                  ).catch((e) => logger.warn({ error: e.message, key: obj.Key }, 'r2.cleanup.single_delete_failed'))
                )
              );
              logger.info({ deletedCount: toDelete.length }, 'resume.cleanup.r2_orphans_purged');
            }
          }
        }

        isTruncated = listRes.IsTruncated;
        continuationToken = listRes.NextContinuationToken;
      }
    }
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      const current = Date.now();
      if (current - lastCleanupDbWarningAt >= CLEANUP_DB_WARN_COOLDOWN_MS) {
        lastCleanupDbWarningAt = current;
        logger.warn(
          { reason: summarizeDatabaseConnectivityError(error) },
          'Resume cleanup skipped because the database is temporarily unavailable.'
        );
      }
      return;
    }
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
  __resetResumeCleanupWarningForTests: () => {
    lastCleanupDbWarningAt = 0;
  },
};
