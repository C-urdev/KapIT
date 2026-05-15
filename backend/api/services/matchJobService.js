const { matchJobsBySkills } = require('./aiService');
const { createProfileMatchSignature } = require('../utils/matchSignatures');

const CACHE_TTL_MS = Number(process.env.MATCH_JOBS_CACHE_TTL_MS || 120000);
const cache = new Map();

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return Array.from(
    new Set(
      skills
        .map((skill) => String(skill || '').trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 50)
    )
  );
};

const normalizeExperience = (experience) => {
  const value = String(experience || '').trim().toLowerCase();
  return value || 'junior';
};

const normalizeStringList = (value, max = 80) => (
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
        .slice(0, max)
    )
  )
);

const normalizeCandidate = ({ candidate, normalizedSkills }) => {
  const profile = candidate && typeof candidate === 'object' ? candidate : {};
  const profileSkills = normalizeStringList(profile.skills, 80);
  const skills = Array.from(new Set([...profileSkills, ...normalizedSkills]));
  return {
    id: profile.id || profile.userId || '',
    full_name: profile.fullName || profile.name || profile.username || '',
    preferred_role: profile.preferredRole || profile.desiredRole || profile.desiredJob || profile.jobTitle || '',
    bio: profile.bio || profile.summary || profile.aboutMe || '',
    resume_text: profile.resumeText || '',
    skills,
    location: profile.location || profile.address || '',
    experience_years: Number.isFinite(Number(profile.experienceYears))
      ? Number(profile.experienceYears)
      : Number.isFinite(Number(profile.yearsOfExperience))
        ? Number(profile.yearsOfExperience)
        : 0,
    certifications: profile.certifications || '',
    education: profile.education || '',
    projects: normalizeStringList(profile.projects, 60),
    preferred_categories: normalizeStringList(profile.preferredCategories, 20),
    tech_stack: normalizeStringList(profile.techStack, 40),
    account_type: profile.accountType || '',
  };
};

const buildCacheKey = ({ userId, profileSignature, skills, experience }) => (
  `${userId || 'anonymous'}::${profileSignature || 'no-profile'}::${experience}::${skills.join('|')}`
);

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCached = (key, value) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const normalizeMatch = (row) => ({
  id: row?.id == null ? null : Number(row.id),
  title: String(row?.title || 'Untitled job'),
  match: Math.max(0, Math.min(100, Number(row?.match || 0))),
  fit_score: Math.max(0, Math.min(100, Number(row?.fit_score ?? row?.match ?? 0))),
  fit_label: String(row?.fit_label || ''),
  confidence_score: Math.max(0, Math.min(100, Number(row?.confidence_score || 0))),
  confidence_label: String(row?.confidence_label || ''),
  role_relevance: Math.max(0, Math.min(100, Number(row?.role_relevance || 0))),
  reasoning_summary: String(row?.reasoning_summary || ''),
  source: String(row?.source || 'ai'),
  insufficient_data: Boolean(row?.insufficient_data),
  matched_skills: Array.isArray(row?.matched_skills) ? row.matched_skills : [],
  missing_skills: Array.isArray(row?.missing_skills) ? row.missing_skills : [],
  strengths: Array.isArray(row?.strengths) ? row.strengths : [],
  concerns: Array.isArray(row?.concerns) ? row.concerns : [],
  keyword_overlap: Array.isArray(row?.keyword_overlap) ? row.keyword_overlap : [],
});

const fetchJobMatches = async ({ userId, skills, experience, candidate }) => {
  const normalizedSkills = normalizeSkills(skills);
  const normalizedExperience = normalizeExperience(experience);
  const normalizedCandidate = normalizeCandidate({ candidate, normalizedSkills });
  const profileSignature = createProfileMatchSignature(normalizedCandidate);
  const key = buildCacheKey({
    userId,
    profileSignature,
    skills: normalizedSkills,
    experience: normalizedExperience,
  });

  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const response = await matchJobsBySkills({
    skills: normalizedSkills,
    experience: normalizedExperience,
    candidate: normalizedCandidate,
  });

  if (!Array.isArray(response)) {
    const error = new Error('FastAPI returned an invalid match payload.');
    error.code = 'FASTAPI_INVALID_RESPONSE';
    error.statusCode = 502;
    throw error;
  }

  const matches = response.map(normalizeMatch);
  setCached(key, matches);
  return matches;
};

module.exports = {
  fetchJobMatches,
};
