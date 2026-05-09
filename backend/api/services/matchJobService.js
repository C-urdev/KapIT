const { matchJobsBySkills } = require('./aiService');

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

const buildCacheKey = ({ skills, experience }) => `${experience}::${skills.join('|')}`;

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
  matched_skills: Array.isArray(row?.matched_skills) ? row.matched_skills : [],
  missing_skills: Array.isArray(row?.missing_skills) ? row.missing_skills : [],
});

const fetchJobMatches = async ({ skills, experience }) => {
  const normalizedSkills = normalizeSkills(skills);
  const normalizedExperience = normalizeExperience(experience);
  const key = buildCacheKey({ skills: normalizedSkills, experience: normalizedExperience });

  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const response = await matchJobsBySkills({
    skills: normalizedSkills,
    experience: normalizedExperience,
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
