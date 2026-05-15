const DEFAULT_TIMEOUT_MS = Number(process.env.FASTAPI_TIMEOUT_MS || 12000);

const normalizeBaseUrl = () =>
  String(process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || '')
    .trim()
    .replace(/\/$/, '');

const isAiConfigured = () => Boolean(normalizeBaseUrl());

const resolveInternalServiceToken = () =>
  String(process.env.FASTAPI_INTERNAL_SERVICE_TOKEN || process.env.INTERNAL_SERVICE_TOKEN || '').trim();

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const postToFastApi = async (path, payload) => {
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

const buildCandidateProfilePayload = (profile) => ({
  id: profile?.id || profile?.userId || '',
  name: profile?.fullName || profile?.username || profile?.name || '',
  desired_role: profile?.preferredRole || profile?.desiredJob || profile?.jobTitle || '',
  summary: profile?.aboutMe || profile?.bio || '',
  resume_text: profile?.resumeText || profile?.resume || '',
  skills: Array.isArray(profile?.skills) ? profile.skills : [],
  location: profile?.location || profile?.address || '',
  preferred_type: profile?.preferredType || profile?.workPreference || '',
  experience_years: profile?.yearsOfExperience == null ? null : Number(profile.yearsOfExperience),
});

const buildJobPayload = (job) => ({
  id: job?.id,
  title: job?.title || '',
  description: job?.description || '',
  location: job?.location || '',
  type: job?.type || '',
  skills: Array.isArray(job?.skills) ? job.skills : [],
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

const matchJobsBySkills = async ({ skills, experience }) =>
  postToFastApi('/match-jobs', {
    skills: Array.isArray(skills) ? skills : [],
    experience: String(experience || '').trim().toLowerCase(),
  });

const getChatbotReply = async ({ message, lastIntent }) =>
  postToFastApi('/api/chatbot/message', {
    message: String(message || '').trim(),
    last_intent: String(lastIntent || '').trim().toLowerCase() || undefined,
  });

module.exports = {
  isAiConfigured,
  matchJobsForCandidate,
  rankCandidatesForJob,
  analyzeResumeProfile,
  matchJobsBySkills,
  getChatbotReply,
};
