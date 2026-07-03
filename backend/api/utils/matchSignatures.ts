const crypto = require('crypto');

const CURRENT_MATCH_SCORING_VERSION = 'v10';

const normalizeMatchText = (value: unknown): string => String(value || '').trim().toLowerCase();

const normalizeFlexibleList = (values: unknown): string[] => {
  if (Array.isArray(values)) {
    return values;
  }
  if (typeof values === 'string') {
    return values.split(/[\n,;/]+/g);
  }
  return [];
};

const stableStringifyList = (values: unknown): string => (
  normalizeFlexibleList(values)
    .map((value: string) => normalizeMatchText(value))
    .filter(Boolean)
    .sort()
    .join('|')
);

const stableProjectDigest = (projects: unknown): string => (
  Array.isArray(projects)
    ? projects
      .map((item: unknown) => {
        if (!item) return '';
        if (typeof item === 'string') return normalizeMatchText(item);
        return normalizeMatchText((item as Record<string, unknown>)?.title || (item as Record<string, unknown>)?.name || (item as Record<string, unknown>)?.description || '');
      })
      .filter(Boolean)
      .sort()
      .join('|')
    : ''
);

const createProfileMatchSignature = (profile: Record<string, unknown>): string => {
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

const createJobMatchSignature = (job: Record<string, unknown>): string => {
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

interface MatchCacheInput {
  metadata?: Record<string, unknown>;
  profileSignature?: string;
  jobSignature?: string;
}

const isMatchCacheValid = ({ metadata = {}, profileSignature, jobSignature }: MatchCacheInput): boolean => (
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
