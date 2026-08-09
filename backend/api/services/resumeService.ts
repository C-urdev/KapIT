const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { logger } = require('../config/logger');
const pool = require('../config/database');
const {
  parseResumeText,
  callGeminiForResume,
  buildDocxBuffer,
  buildGeneratedFileName,
} = require('./resumeOptimizationService');
const { storeResumeUpload, storeGeneratedResumeArtifact, getStoredNameFromResumeUrl, getStoredResumePath } = require('./resumeStorageService');
const { convertDocxToPdf } = require('./pdfConversionService');
const { scanFile, quarantineFile } = require('./antivirusService');
const { emitResumeJobEvent } = require('./resumeJobEvents');

const SIGNED_URL_SECRET = String(process.env.RESUME_SIGNED_URL_SECRET || process.env.JWT_SECRET || 'dev-secret');
const SIGNED_URL_TTL_SEC = Math.max(60, Number(process.env.RESUME_SIGNED_URL_TTL_SEC || 900));

const signDownload = ({ resumeId, fileKind, userId }) => {
  const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SEC;
  const payload = `${resumeId}:${fileKind}:${userId}:${exp}`;
  const sig = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(payload).digest('hex');
  return { exp, sig };
};

const verifyDownload = ({ resumeId, fileKind, userId, exp, sig }) => {
  if (!['pdf', 'docx'].includes(String(fileKind || '').toLowerCase())) return false;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  if (expires > Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SEC + 60) return false;
  const payload = `${resumeId}:${fileKind}:${userId}:${expires}`;
  const expected = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(payload).digest('hex');
  const given = String(sig || '');
  if (given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
};

const readStreamBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const parseR2ResumeText = async (source) => {
  if (!source.r2_object_key) {
    throw Object.assign(new Error('Source file not available.'), { statusCode: 404 });
  }

  const { getR2ObjectStream } = require('./r2UploadService');
  const ext = path.extname(String(source.r2_object_key || source.original_filename || '.pdf')) || '.pdf';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kapit-r2-resume-'));
  const tempPath = path.join(tempDir, `source${ext}`);

  try {
    const streamData = await getR2ObjectStream({ objectKey: source.r2_object_key });
    const buffer = await readStreamBuffer(streamData.body);
    await fs.writeFile(tempPath, buffer, { flag: 'wx' });
    return await parseResumeText({ absolutePath: tempPath, fileName: source.original_filename });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};

const resolveSourceResumeText = async (source) => {
  if (source.extracted_text) {
    return source.extracted_text;
  }

  if (source.storage_provider === 'r2') {
    return await parseR2ResumeText(source);
  }

  const sourceUrl = source.pdf_url || source.docx_url;
  const storedName = getStoredNameFromResumeUrl(sourceUrl);
  const absolutePath = getStoredResumePath(storedName);
  if (!absolutePath) throw Object.assign(new Error('Source file not available.'), { statusCode: 404 });
  return await parseResumeText({ absolutePath, fileName: source.original_filename });
};

const upsertLegacyProfilePointers = async (client, userId) => {
  const result = await client.query(
    `SELECT id, resume_type, pdf_url, docx_url, ats_data_json
     FROM resumes
     WHERE user_id = $1 AND archived_at IS NULL
     ORDER BY is_primary DESC, created_at DESC`,
    [userId]
  );
  const rows = result.rows;
  const primaryOriginal = rows.find((r) => r.resume_type === 'original');
  const primaryAts = rows.find((r) => r.resume_type === 'ats_optimized');
  await client.query(
    `INSERT INTO developer_profiles (user_id, resume_url, optimized_resume_docx_url, optimized_resume_pdf_url, optimized_resume_json, updated_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET
      resume_url = EXCLUDED.resume_url,
      optimized_resume_docx_url = EXCLUDED.optimized_resume_docx_url,
      optimized_resume_pdf_url = EXCLUDED.optimized_resume_pdf_url,
      optimized_resume_json = EXCLUDED.optimized_resume_json,
      updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      primaryOriginal?.pdf_url || primaryOriginal?.docx_url || null,
      primaryAts?.docx_url || null,
      primaryAts?.pdf_url || null,
      JSON.stringify(primaryAts?.ats_data_json || {}),
    ]
  );
};

const createOriginalResume = async ({ userId, buffer, originalName, contentType }) => {
  const stored = await storeResumeUpload({ buffer, originalName, contentType });
  const scan = await scanFile({ absolutePath: stored.absolutePath });
  if (!scan.clean) {
    await quarantineFile({ absolutePath: stored.absolutePath, storedName: stored.storedName });
    throw Object.assign(new Error(`Upload quarantined: ${scan.reason}`), { statusCode: 422 });
  }
  const ext = path.extname(String(stored.originalName || '')).toLowerCase();
  const pdfUrl = ext === '.pdf' ? stored.url : null;
  const docxUrl = ext === '.docx' ? stored.url : null;
  const extractedText = await parseResumeText({ absolutePath: stored.absolutePath, fileName: stored.originalName }).catch(() => '');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE resumes SET is_primary = FALSE WHERE user_id = $1 AND resume_type = 'original' AND is_primary = TRUE`, [userId]);
    const insert = await client.query(
      `INSERT INTO resumes (user_id, resume_type, original_filename, storage_provider, pdf_url, docx_url, extracted_text, is_primary, is_public, visibility_scope, processing_status)
       VALUES ($1,'original',$2,'local',$3,$4,$5,TRUE,FALSE,'private','completed')
       RETURNING *`,
      [userId, stored.originalName, pdfUrl, docxUrl, extractedText]
    );
    await upsertLegacyProfilePointers(client, userId);
    await client.query('COMMIT');
    return insert.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const runAtsOptimizationJob = async ({ userId, sourceResumeId, jobId }) => {
  let client = null;
  try {
    emitResumeJobEvent(jobId, { status: 'processing', step: 'extract_text', progress: 10 });
    await pool.query(
      `UPDATE resume_jobs SET status='processing', current_step='extract_text', progress_percent=10, started_at=COALESCE(started_at, CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [jobId]
    );
    const sourceResult = await pool.query(
      `SELECT * FROM resumes WHERE id = $1 AND user_id = $2 AND archived_at IS NULL LIMIT 1`,
      [sourceResumeId, userId]
    );
    const source = sourceResult.rows[0];
    if (!source) throw Object.assign(new Error('Source resume not found.'), { statusCode: 404 });
    const resumeText = await resolveSourceResumeText(source);

    await pool.query(`UPDATE resume_jobs SET current_step='gemini_optimize', progress_percent=35, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [jobId]);
    emitResumeJobEvent(jobId, { status: 'processing', step: 'gemini_optimize', progress: 35 });
    const roleResult = await pool.query(
      `SELECT COALESCE(preferred_it_role, '') AS preferred_role
       FROM developer_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );
    const preferredRole = String(roleResult.rows[0]?.preferred_role || '').trim();
    const atsData = await callGeminiForResume({ resumeText, preferredRole });
    await pool.query(`UPDATE resume_jobs SET current_step='generate_docx', progress_percent=55, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [jobId]);
    const docxBuffer = await buildDocxBuffer({ fullName: 'Candidate', role: '', structured: atsData });
    const docxStored = await storeGeneratedResumeArtifact({ buffer: docxBuffer, fileName: buildGeneratedFileName('ats-resume', '.docx') });
    const docxScan = await scanFile({ absolutePath: docxStored.absolutePath });
    if (!docxScan.clean) {
      await quarantineFile({ absolutePath: docxStored.absolutePath, storedName: docxStored.storedName });
      throw new Error(`Generated DOCX quarantined: ${docxScan.reason}`);
    }

    await pool.query(`UPDATE resume_jobs SET current_step='convert_pdf', progress_percent=70, updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [jobId]);
    emitResumeJobEvent(jobId, { status: 'processing', step: 'convert_pdf', progress: 70 });
    const converted = await convertDocxToPdf({ docxAbsolutePath: docxStored.absolutePath, context: { userId, sourceResumeId, jobId } });
    
    let pdfStoredUrl = null;
    if (!converted.ok) {
      logger.warn({ jobId, error: converted.error || converted.reason }, 'DOCX to PDF conversion skipped/failed during queue job.');
    } else {
      const pdfBuffer = converted.buffer;
      const pdfStored = await storeGeneratedResumeArtifact({ buffer: pdfBuffer, fileName: buildGeneratedFileName('ats-resume', '.pdf') });
      const pdfScan = await scanFile({ absolutePath: pdfStored.absolutePath });
      if (!pdfScan.clean) {
        await quarantineFile({ absolutePath: pdfStored.absolutePath, storedName: pdfStored.storedName });
        throw new Error(`Generated PDF quarantined: ${pdfScan.reason}`);
      }
      pdfStoredUrl = pdfStored.url;
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(`UPDATE resumes SET is_primary=FALSE WHERE user_id=$1 AND resume_type='ats_optimized' AND is_primary=TRUE`, [userId]);
    const insertAts = await client.query(
      `INSERT INTO resumes (user_id, resume_type, source_resume_id, original_filename, storage_provider, pdf_url, docx_url, extracted_text, ats_score, ats_data_json, is_primary, is_public, visibility_scope, processing_status)
       VALUES ($1,'ats_optimized',$2,$3,'local',$4,$5,$6,$7,$8::jsonb,TRUE,FALSE,'private','completed')
       RETURNING id`,
      [userId, sourceResumeId, 'ats-resume.docx', pdfStoredUrl, docxStored.url, resumeText, Number(atsData?.atsScore || 60), JSON.stringify(atsData)]
    );
    const atsResumeId = insertAts.rows[0].id;
    await client.query(
      `UPDATE resume_jobs
       SET status='completed', current_step='completed', progress_percent=100, result_resume_id=$2, completed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1`,
      [jobId, atsResumeId]
    );
    await upsertLegacyProfilePointers(client, userId);
    await client.query('COMMIT');
    client.release();
    client = null;
    emitResumeJobEvent(jobId, { status: 'completed', step: 'completed', progress: 100, resultResumeId: atsResumeId });
    return atsResumeId;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    await pool.query(
      `UPDATE resume_jobs SET status='failed', error_message=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [jobId, error?.message || 'Job failed']
    ).catch(() => {});
    emitResumeJobEvent(jobId, { status: 'failed', step: 'failed', progress: 100, error: error?.message || 'Job failed' });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

const createResumeJob = async ({ userId, resumeId }) => {
  const result = await pool.query(
    `INSERT INTO resume_jobs (resume_id, user_id, job_type, current_step, progress_percent, status)
     VALUES ($1,$2,'ats_optimize','queued',0,'queued')
     RETURNING *`,
    [resumeId, userId]
  );
  emitResumeJobEvent(result.rows[0].id, { status: 'queued', step: 'queued', progress: 0 });
  return result.rows[0];
};

const listUserVisibleResume = async ({ resumeId, requester }) => {
  const result = await pool.query(
    `SELECT r.*,
            u.account_type,
            u.user_type,
            EXISTS (
              SELECT 1
              FROM companies c
              JOIN jobs j ON j.company_id = c.id
              JOIN applications a ON a.job_id = j.id
              WHERE c.user_id = $2
                AND a.resume_id = r.id
            ) AS requester_company_has_application
     FROM resumes r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = $1 AND r.archived_at IS NULL
     LIMIT 1`,
    [resumeId, requester?.id || null]
  );
  const row = result.rows[0];
  if (!row) return null;
  const isOwner = requester && row.user_id === requester.id;
  const isCompany = requester && (requester.accountType === 'company' || requester.userType === 'company');
  const canView =
    isOwner ||
    row.is_public ||
    (isCompany && row.visibility_scope === 'public_profile') ||
    (isCompany && row.visibility_scope === 'applications_only' && row.requester_company_has_application);
  if (!canView) return { forbidden: true };
  return row;
};

module.exports = {
  signDownload,
  verifyDownload,
  createOriginalResume,
  createResumeJob,
  runAtsOptimizationJob,
  listUserVisibleResume,
};
