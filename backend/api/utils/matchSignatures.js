const crypto = require('crypto');

const normalizeMatchText = (value) => String(value || '').trim().toLowerCase();

const stableStringifyList = (values) => (
  Array.isArray(values)
    ? values
      .map((value) => normalizeMatchText(value))
      .filter(Boolean)
      .sort()
      .join('|')
    : ''
);

const createProfileMatchSignature = (profile) => {
  const payload = [
    normalizeMatchText(profile?.full_name || profile?.fullName || profile?.name),
    normalizeMatchText(profile?.preferred_role || profile?.preferredRole || profile?.desired_role || profile?.desiredRole),
    normalizeMatchText(profile?.bio || profile?.summary),
    normalizeMatchText(profile?.location),
    String(Number(profile?.experience_years ?? profile?.experienceYears ?? 0)),
    stableStringifyList(profile?.skills),
  ].join('::');
  return crypto.createHash('sha1').update(payload).digest('hex');
};

const createJobMatchSignature = (job) => {
  const payload = [
    normalizeMatchText(job?.title),
    normalizeMatchText(job?.description),
    normalizeMatchText(job?.type),
    normalizeMatchText(job?.location),
    stableStringifyList(job?.skills),
  ].join('::');
  return crypto.createHash('sha1').update(payload).digest('hex');
};

const isMatchCacheValid = ({ metadata = {}, profileSignature, jobSignature }) => (
  String(metadata?.profileSignature || '') === String(profileSignature || '')
  && String(metadata?.jobSignature || '') === String(jobSignature || '')
);

module.exports = {
  createProfileMatchSignature,
  createJobMatchSignature,
  isMatchCacheValid,
};

