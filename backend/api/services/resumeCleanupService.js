const pool = require('../config/database');
const { logger } = require('../config/logger');
const fs = require('fs/promises');
const { getStoredNameFromResumeUrl, getStoredResumePath } = require('./resumeStorageService');
const { ensureResumeSchemaReady } = require('../config/runtimeSchema');
const { getR2Client, getR2BucketName, isR2Enabled } = require('../config/r2');
const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

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

    // Orphaned R2 File Purge
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
        const oldObjects = contents.filter(obj => obj.LastModified && obj.LastModified < twentyFourHoursAgo);
        
        if (oldObjects.length > 0) {
          // Batch check DB to see if they are referenced
          const keys = oldObjects.map(o => o.Key);
          
          // Split into smaller chunks to avoid massive queries
          const chunkSize = 100;
          for (let i = 0; i < keys.length; i += chunkSize) {
            const chunk = keys.slice(i, i + chunkSize);
            const { rows } = await pool.query(
              `SELECT r2_object_key FROM resumes WHERE r2_object_key = ANY($1)`,
              [chunk]
            );
            
            const referencedKeys = new Set(rows.map(r => r.r2_object_key));
            const toDelete = chunk.filter(k => !referencedKeys.has(k)).map(k => ({ Key: k }));
            
            if (toDelete.length > 0) {
              await client.send(
                new DeleteObjectsCommand({
                  Bucket: bucket,
                  Delete: { Objects: toDelete, Quiet: true },
                })
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
