const DEFAULT_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 12000);
const CHATBOT_UPSTREAM_COOLDOWN_MS = Math.max(1000, Number(process.env.FASTAPI_CHATBOT_COOLDOWN_MS || 60000));
const FASTAPI_RETRY_MAX = Math.max(1, Number(process.env.FASTAPI_RETRY_MAX || 3));
const FASTAPI_RETRY_BASE_MS = Math.max(50, Number(process.env.FASTAPI_RETRY_BASE_MS || 250));

let chatbotUpstreamCooldownUntilMs = 0;

const normalizeBaseUrl = () =>
  String(process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || '')
    .trim()
    .replace(/\/$/, '');

const isAiConfigured = () => Boolean(normalizeBaseUrl());

const resolveInternalServiceToken = () =>
  String(process.env.FASTAPI_INTERNAL_SERVICE_TOKEN || process.env.INTERNAL_SERVICE_TOKEN || '').trim();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const isRetryableStatus = (statusCode) => Number(statusCode) >= 500 || Number(statusCode) === 429;

const isRetryableNetworkError = (error) => {
  if (!error) return false;
  const code = String(error?.code || '').toUpperCase();
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED', 'EPIPE', 'ENOTFOUND'].includes(code)) {
    return true;
  }
  return false;
};

const toTrimmedStringList = (value, { max = 60 } = {}) => {
  if (!value) return [];
  const rawItems = Array.isArray(value)
    ? value
    : String(value)
      .split(/[\n,;/]+/g)
      .map((item) => item.trim());
  return Array.from(
    new Set(
      rawItems
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, max)
    )
  );
};

const postToFastApiOnce = async (path, payload) => {
  const baseUrl = normalizeBaseUrl();
  const internalServiceToken = resolveInternalServiceToken();

  if (!baseUrl) {
    const error = new Error('FASTAPI_URL is not configured.');
    error.code = 'FASTAPI_NOT_CONFIGURED';
    throw error;
  }
  if (!internalServiceToken) {
    const error = new Error('FASTAPI_INTERNAL_SERVICE_TOKEN is not configured.');
    error.code = 'FASTAPI_AUTH_NOT_CONFIGURED';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internalServiceToken}`,
        'X-Internal-Service-Token': internalServiceToken,
      },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });
    const data = await safeJson(response);
    if (!response.ok) {
      const error = new Error(
        data?.message ||
          data?.error ||
          (Array.isArray(data?.detail) ? data.detail.join(', ') : data?.detail) ||
          `FastAPI request failed for ${path}.`
      );
      error.statusCode = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`FastAPI request timed out for ${path}.`);
      timeoutError.code = 'FASTAPI_TIMEOUT';
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const postToFastApi = async (path, payload) => {
  let lastError = null;

  for (let attempt = 1; attempt <= FASTAPI_RETRY_MAX; attempt += 1) {
    try {
      return await postToFastApiOnce(path, payload);
    } catch (error) {
      lastError = error;
      const statusCode = Number(error?.statusCode || 0);
      const retryable = isRetryableStatus(statusCode) || isRetryableNetworkError(error) || error?.code === 'FASTAPI_TIMEOUT';
      if (!retryable || attempt >= FASTAPI_RETRY_MAX) {
        throw error;
      }

      const backoffMs = FASTAPI_RETRY_BASE_MS * (2 ** (attempt - 1));
      await wait(backoffMs);
    }
  }

  throw lastError || new Error(`FastAPI request failed for ${path}.`);
};

const buildCandidateProfilePayload = (profile) => ({
  id: profile?.id || profile?.userId || '',
  name: profile?.fullName || profile?.username || profile?.name || '',
  desired_role: profile?.preferredRole || profile?.desiredJob || profile?.jobTitle || '',
  summary: profile?.aboutMe || profile?.bio || '',
  resume_text: profile?.resumeText || '',
  skills: toTrimmedStringList(profile?.skills),
  location: profile?.location || profile?.address || '',
  preferred_type: profile?.preferredType || profile?.workPreference || '',
  experience_years: profile?.yearsOfExperience == null ? null : Number(profile.yearsOfExperience),
  account_type: profile?.accountType || '',
  certifications: Array.isArray(profile?.certifications)
    ? profile.certifications.join(', ')
    : String(profile?.certifications || '').trim(),
  education: String(profile?.education || '').trim(),
  projects: toTrimmedStringList(profile?.projects, { max: 80 }),
  preferred_categories: toTrimmedStringList(profile?.preferredCategories),
  tech_stack: toTrimmedStringList(profile?.techStack),
  profile_completeness: Number.isFinite(Number(profile?.profileCompleteness))
    ? Number(profile.profileCompleteness)
    : null,
  profile_completed: typeof profile?.profileCompleted === 'boolean'
    ? profile.profileCompleted
    : typeof profile?.profile_completed === 'boolean'
      ? profile.profile_completed
      : null,
});

const buildJobPayload = (job) => ({
  id: job?.id,
  title: job?.title || '',
  description: job?.description || '',
  location: job?.location || '',
  type: job?.type || '',
  skills: toTrimmedStringList(job?.skills),
  technologies: toTrimmedStringList(job?.technologies),
  keywords: toTrimmedStringList(job?.keywords),
  certifications: toTrimmedStringList(job?.certifications),
  seniority: String(job?.seniority || job?.experienceLevel || '').trim(),
  required_years: Number.isFinite(Number(job?.requiredYears)) ? Number(job.requiredYears) : null,
  industry: String(job?.industry || '').trim(),
  category: String(job?.category || '').trim(),
  tags: toTrimmedStringList(job?.tags),
});

const matchJobsForCandidate = async ({ candidate, jobs }) =>
  postToFastApi('/ai/match-jobs', {
    candidate: buildCandidateProfilePayload(candidate),
    jobs: Array.isArray(jobs) ? jobs.map(buildJobPayload) : [],
  });

const rankCandidatesForJob = async ({ job, candidates }) =>
  postToFastApi('/ai/rank-candidates', {
    job: buildJobPayload(job),
    candidates: Array.isArray(candidates) ? candidates.map(buildCandidateProfilePayload) : [],
  });

const analyzeResumeProfile = async (candidate) =>
  postToFastApi('/ai/analyze-resume', {
    candidate: buildCandidateProfilePayload(candidate),
  });

const matchJobsBySkills = async ({ skills, experience, candidate }) =>
  postToFastApi('/match-jobs', {
    skills: toTrimmedStringList(skills),
    experience: String(experience || '').trim().toLowerCase(),
    candidate: candidate ? buildCandidateProfilePayload(candidate) : undefined,
  });

const getChatbotReply = async ({ message, lastIntent }) =>
  (async () => {
    if (Date.now() < chatbotUpstreamCooldownUntilMs) {
      const cooldownError = new Error('FastAPI chatbot upstream is temporarily unavailable.');
      cooldownError.code = 'FASTAPI_CHATBOT_UNAVAILABLE';
      cooldownError.statusCode = 503;
      throw cooldownError;
    }

    try {
      const data = await postToFastApi('/api/chatbot/message', {
        message: String(message || '').trim(),
        last_intent: String(lastIntent || '').trim().toLowerCase() || undefined,
      });
      chatbotUpstreamCooldownUntilMs = 0;
      return data;
    } catch (error) {
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode >= 500 || error?.code === 'FASTAPI_TIMEOUT') {
        chatbotUpstreamCooldownUntilMs = Date.now() + CHATBOT_UPSTREAM_COOLDOWN_MS;
      }
      throw error;
    }
  })();

module.exports = {
  isAiConfigured,
  matchJobsForCandidate,
  rankCandidatesForJob,
  analyzeResumeProfile,
  matchJobsBySkills,
  getChatbotReply,
};
