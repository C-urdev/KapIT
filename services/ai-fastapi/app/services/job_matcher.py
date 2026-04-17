from __future__ import annotations

import re


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9\+\#\.\-]{2,}")
EXPERIENCE_KEYWORDS = {
    'intern': {'intern', 'entry', 'entry-level', 'trainee', 'fresh'},
    'junior': {'junior', 'associate', 'entry', 'entry-level'},
    'mid': {'mid', 'intermediate', 'experienced'},
    'senior': {'senior', 'lead', 'principal', 'staff'},
}
STOP_WORDS = {
    'with', 'from', 'this', 'that', 'your', 'have', 'will', 'must', 'able',
    'into', 'role', 'team', 'work', 'year', 'years', 'using', 'experience',
    'developer', 'engineer', 'company', 'skills', 'skill', 'remote', 'onsite',
}


def normalize_skill(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(str(text or ""))]


def normalize_skills(skills: list[str] | None) -> list[str]:
    if not skills:
        return []
    normalized = [normalize_skill(item) for item in skills if normalize_skill(item)]
    return sorted(set(normalized))


def optional_keywords_for_job(job: dict, required_skills: set[str], limit: int = 12) -> set[str]:
    text = f"{job.get('title', '')} {job.get('description', '')}"
    keywords: list[str] = []
    for token in tokenize(text):
        if token in STOP_WORDS or len(token) < 3:
            continue
        if token in required_skills:
            continue
        if token not in keywords:
            keywords.append(token)
        if len(keywords) >= limit:
            break
    return set(keywords)


def experience_bonus(experience: str, job: dict) -> int:
    normalized_experience = str(experience or '').strip().lower()
    if normalized_experience not in EXPERIENCE_KEYWORDS:
        return 0

    text = f"{job.get('title', '')} {job.get('description', '')}".lower()
    if any(keyword in text for keyword in EXPERIENCE_KEYWORDS[normalized_experience]):
        return 5
    return 2


def compute_match_for_job(candidate_skills: set[str], experience: str, job: dict) -> dict:
    required = set(normalize_skills(job.get('skills') or []))
    optional = optional_keywords_for_job(job, required)

    matched_required = sorted(required.intersection(candidate_skills))
    matched_optional = sorted(optional.intersection(candidate_skills))
    missing_required = sorted(required.difference(candidate_skills))

    required_score = 0 if not required else round((len(matched_required) / len(required)) * 75)
    optional_score = 0 if not optional else round((len(matched_optional) / len(optional)) * 20)
    bonus = experience_bonus(experience, job)
    match_score = max(0, min(100, required_score + optional_score + bonus))

    return {
        'id': int(job.get('id')) if job.get('id') is not None else None,
        'title': str(job.get('title') or 'Untitled job'),
        'match': match_score,
        'matched_skills': matched_required,
        'missing_skills': missing_required,
    }


def build_job_matches(skills: list[str], experience: str, jobs: list[dict]) -> list[dict]:
    candidate_skills = set(normalize_skills(skills))
    matches = [compute_match_for_job(candidate_skills, experience, job) for job in jobs]
    matches.sort(key=lambda item: item['match'], reverse=True)
    return matches
