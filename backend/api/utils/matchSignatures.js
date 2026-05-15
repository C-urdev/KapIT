const crypto = require('crypto');
const CURRENT_MATCH_SCORING_VERSION = 'v8';

const normalizeMatchText = (value) => String(value || '').trim().toLowerCase();

const normalizeFlexibleList = (values) => {
  if (Array.isArray(values)) {
    return values;
  }
  if (typeof values === 'string') {
    return values.split(/[\n,;/]+/g);
  }
  return [];
};

const stableStringifyList = (values) => (
  normalizeFlexibleList(values)
    .map((value) => normalizeMatchText(value))
    .filter(Boolean)
    .sort()
    .join('|')
);

const stableProjectDigest = (projects) => (
  Array.isArray(projects)
    ? projects
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return normalizeMatchText(item);
        return normalizeMatchText(item?.title || item?.name || item?.description || '');
      })
      .filter(Boolean)
      .sort()
      .join('|')
    : ''
);

const createProfileMatchSignature = (profile) => {
  const payload = [
    normalizeMatchText(profile?.full_name || profile?.fullName || profile?.name),
    normalizeMatchText(
      profile?.preferred_role
        || profile?.preferredRole
        || profile?.desired_role
        || profile?.desiredRole
        || profile?.desiredJob
        || profile?.job_title
        || profile?.jobTitle
    ),
    normalizeMatchText(profile?.bio || profile?.summary),
    normalizeMatchText(profile?.resume_text || profile?.resumeText),
    normalizeMatchText(profile?.location),
    normalizeMatchText(profile?.education),
    normalizeMatchText(profile?.certifications),
    normalizeMatchText(profile?.account_type || profile?.accountType),
    stableStringifyList(profile?.preferred_categories || profile?.preferredCategories),
    stableStringifyList(profile?.tech_stack || profile?.techStack),
    stableProjectDigest(profile?.projects),
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
    normalizeMatchText(job?.industry),
    normalizeMatchText(job?.category),
    normalizeMatchText(job?.seniority || job?.experienceLevel),
    stableStringifyList(job?.technologies),
    stableStringifyList(job?.keywords),
    stableStringifyList(job?.tags),
    stableStringifyList(job?.skills),
  ].join('::');
  return crypto.createHash('sha1').update(payload).digest('hex');
};

const isMatchCacheValid = ({ metadata = {}, profileSignature, jobSignature }) => (
  String(metadata?.profileSignature || '') === String(profileSignature || '')
  && String(metadata?.jobSignature || '') === String(jobSignature || '')
  && String(metadata?.scoringVersion || '') === CURRENT_MATCH_SCORING_VERSION
);

module.exports = {
  CURRENT_MATCH_SCORING_VERSION,
  createProfileMatchSignature,
  createJobMatchSignature,
  isMatchCacheValid,
};
