const { S3Client } = require('@aws-sdk/client-s3');
const { logger } = require('./logger');

let r2Client = null;
let initLogged = false;

const readEnv = (key) => {
  let val = String(process.env[key] || '').trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  }
  return val;
};

const isR2Enabled = () => readEnv('R2_ENABLED').toLowerCase() === 'true';

const getR2BucketName = () => {
  let name = readEnv('R2_BUCKET_NAME') || 'kapit-uploads';
  name = name.replace(/^(https?|s3|r2):\/\//i, '').replace(/\/$/, '');
  if (name.includes('.r2.cloudflarestorage.com')) {
    name = name.split('.')[0];
  }
  return name;
};

const getR2PresignExpireSeconds = () =>
  Math.min(3600, Math.max(60, Number(readEnv('R2_PRESIGN_EXPIRES_SECONDS') || 300)));

const getR2UploadMaxBytes = () =>
  Math.max(64 * 1024, Number(readEnv('R2_UPLOAD_MAX_BYTES') || 50 * 1024 * 1024));

const getR2Client = () => {
  if (r2Client) return r2Client;

  const accountId = readEnv('R2_ACCOUNT_ID');
  const accessKeyId = readEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = readEnv('R2_SECRET_ACCESS_KEY');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 is enabled but missing required credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
    );
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // R2 requires path-style access
    forcePathStyle: true,
  });

  if (!initLogged) {
    logger.info({ bucket: getR2BucketName() }, 'R2 client initialized.');
    initLogged = true;
  }

  return r2Client;
};

module.exports = {
  isR2Enabled,
  getR2Client,
  getR2BucketName,
  getR2PresignExpireSeconds,
  getR2UploadMaxBytes,
};
