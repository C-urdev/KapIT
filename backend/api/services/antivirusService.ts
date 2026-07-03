const fs = require('fs/promises');
const path = require('path');
const NodeClam = require('clamscan');
const { logger } = require('../config/logger');

const enabled = () => String(process.env.ANTIVIRUS_ENABLED || '').toLowerCase() === 'true';
const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

const quarantineRoot = path.resolve(process.env.RESUME_QUARANTINE_DIR || path.join(__dirname, '..', 'uploads', 'quarantine'));

let clamscanInstance = null;

const getClamscan = async () => {
  if (clamscanInstance) return clamscanInstance;
  try {
    clamscanInstance = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      fileList: null,
      scanRecursively: true,
      clamdscan: {
        socket: process.env.CLAMAV_SOCKET || false,
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000,
        localFallback: false,
        active: true,
      },
      preference: 'clamdscan',
    });
    return clamscanInstance;
  } catch (error) {
    logger.error({ error: error?.message || String(error) }, 'Failed to initialize ClamAV');
    if (isProduction) {
      throw new Error('Antivirus scanner failed to initialize in production mode.');
    }
    return null;
  }
};

const scanFile = async ({ absolutePath }) => {
  if (!enabled()) return { clean: true, skipped: true };
  const maxBytes = Math.max(1, Number(process.env.ANTIVIRUS_SCAN_MAX_BYTES || 20 * 1024 * 1024));
  const buf = await fs.readFile(absolutePath);
  if (buf.length > maxBytes) {
    return { clean: false, reason: 'file_too_large_for_scan' };
  }

  const text = buf.toString('latin1');
  if (text.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
    return { clean: false, reason: 'eicar_signature_detected' };
  }

  const scanner = await getClamscan();
  if (!scanner) {
    logger.warn('ClamAV not available. Bypassing scan in non-production mode.');
    return { clean: true, skipped: true };
  }

  try {
    const { isInfected, viruses } = await scanner.isInfected(absolutePath);
    if (isInfected) {
      return { clean: false, reason: `Malware detected: ${viruses.join(', ')}` };
    }
    return { clean: true };
  } catch (error) {
    logger.error({ error: error?.message || String(error) }, 'ClamAV scan failed');
    if (isProduction) {
      return { clean: false, reason: 'antivirus_scan_error' };
    }
    return { clean: true, skipped: true };
  }
};

const quarantineFile = async ({ absolutePath, storedName }) => {
  await fs.mkdir(quarantineRoot, { recursive: true });
  const target = path.join(quarantineRoot, `${Date.now()}-${storedName}`);
  await fs.rename(absolutePath, target);
  logger.warn({ absolutePath, target }, 'resume.file.quarantined');
  return target;
};

module.exports = {
  scanFile,
  quarantineFile,
};
