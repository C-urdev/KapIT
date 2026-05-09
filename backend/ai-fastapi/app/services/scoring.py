from __future__ import annotations

import re
from collections import Counter
from typing import Iterable


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9\+\#\.\-]{2,}")
ROLE_ALIASES = {
    "frontend": {"front-end", "front", "ui", "react", "next", "vue", "angular", "javascript", "typescript", "web"},
    "backend": {"back-end", "back", "api", "node", "express", "python", "java", "golang", "server"},
    "fullstack": {"full", "stack", "frontend", "backend", "web", "react", "node", "express"},
    "software": {"engineer", "developer", "application", "web", "fullstack"},
    "web": {"frontend", "backend", "fullstack", "react", "next", "javascript", "typescript"},
}
SKILL_ALIASES = {
    "react": {"next.js", "next", "javascript", "typescript"},
    "next.js": {"react", "javascript", "typescript"},
    "javascript": {"typescript", "react", "node.js", "node", "next.js"},
    "typescript": {"javascript", "react", "node.js", "next.js"},
    "node.js": {"node", "express", "javascript", "typescript"},
    "node": {"node.js", "express", "javascript"},
    "express": {"node", "node.js", "javascript"},
}


def normalize_skill(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(str(text or ""))]


def build_candidate_text(candidate: dict) -> str:
    parts = [
        candidate.get("desired_role", ""),
        candidate.get("summary", ""),
        candidate.get("resume_text", ""),
        " ".join(candidate.get("skills") or []),
        candidate.get("location", ""),
    ]
    return " ".join(part for part in parts if part)


def build_job_text(job: dict) -> str:
    parts = [
        job.get("title", ""),
        job.get("description", ""),
        " ".join(job.get("skills") or []),
        job.get("location", ""),
        job.get("type", ""),
    ]
    return " ".join(part for part in parts if part)


def extract_keywords(text: str, limit: int = 20) -> list[str]:
    stop_words = {
        "with", "from", "this", "that", "your", "have", "will", "must", "able",
        "into", "role", "team", "work", "year", "years", "using", "experience",
        "developer", "engineer", "company", "candidate", "skills", "skill",
    }
    counts = Counter(token for token in tokenize(text) if token not in stop_words and len(token) > 2)
    return [word for word, _ in counts.most_common(limit)]


def score_overlap(left: Iterable[str], right: Iterable[str]) -> int:
    left_set = {normalize_skill(item) for item in left if normalize_skill(item)}
    right_set = {normalize_skill(item) for item in right if normalize_skill(item)}
    if not right_set:
        return 0
    overlap = left_set.intersection(right_set)
    return round((len(overlap) / len(right_set)) * 100)


def _expand_with_aliases(skills: set[str]) -> set[str]:
    expanded = set(skills)
    for skill in list(skills):
        expanded.update(SKILL_ALIASES.get(skill, set()))
    return expanded


def score_skill_fit(candidate_skills: Iterable[str], required_skills: Iterable[str]) -> tuple[int, list[str], list[str]]:
    candidate_set = {normalize_skill(item) for item in candidate_skills if normalize_skill(item)}
    required_set = {normalize_skill(item) for item in required_skills if normalize_skill(item)}
    if not required_set:
        return 30, [], []

    direct = candidate_set.intersection(required_set)
    expanded_candidate = _expand_with_aliases(candidate_set)
    semantic = required_set.intersection(expanded_candidate).difference(direct)
    weighted_hits = len(direct) + (len(semantic) * 0.6)
    score = round((weighted_hits / max(len(required_set), 1)) * 100)
    return min(100, score), sorted(direct.union(semantic)), sorted(required_set.difference(direct.union(semantic)))


def score_role_fit(desired_role: str, title: str, description: str) -> int:
    desired_tokens = set(tokenize(desired_role))
    job_tokens = set(tokenize(f"{title} {description}"))
    if not desired_tokens:
        return 0

    expanded = set(desired_tokens)
    for token in list(desired_tokens):
        expanded.update(ROLE_ALIASES.get(token, set()))
    overlap_ratio = len(expanded.intersection(job_tokens)) / max(len(expanded), 1)
    return min(100, round(overlap_ratio * 100))


def score_experience_fit(experience_years: int | None, title: str, description: str) -> int:
    years = int(experience_years or 0)
    text = f"{title} {description}".lower()
    if "senior" in text or "lead" in text or "principal" in text:
        return 95 if years >= 5 else 45 if years >= 3 else 20
    if "junior" in text or "entry" in text or "intern" in text:
        return 90 if years <= 3 else 70
    if "mid" in text or "intermediate" in text:
        return 88 if 2 <= years <= 6 else 65
    return 75 if years >= 1 else 60


def score_location_type_fit(candidate: dict, job: dict) -> int:
    candidate_location_tokens = set(tokenize(candidate.get("location", "")))
    job_location_tokens = set(tokenize(job.get("location", "")))
    location_score = 50
    if candidate_location_tokens and job_location_tokens:
        ratio = len(candidate_location_tokens.intersection(job_location_tokens)) / max(len(job_location_tokens), 1)
        location_score = min(100, round(30 + (ratio * 70)))

    profile_type = normalize_skill(candidate.get("preferred_type", ""))
    job_type = normalize_skill(job.get("type", ""))
    type_score = 70 if not profile_type or not job_type else (95 if profile_type in job_type or job_type in profile_type else 50)
    return round((location_score * 0.6) + (type_score * 0.4))


def compute_match(candidate: dict, job: dict) -> dict:
    candidate_skills = candidate.get("skills") or []
    job_skills = job.get("skills") or []
    candidate_text = build_candidate_text(candidate)
    job_text = build_job_text(job)

    candidate_keywords = set(extract_keywords(candidate_text, limit=30))
    job_keywords = set(extract_keywords(job_text, limit=30))
    keyword_overlap = candidate_keywords.intersection(job_keywords)

    skill_score, matched_skills, missing_skills = score_skill_fit(candidate_skills, job_skills)
    keyword_score = round((len(keyword_overlap) / max(len(job_keywords), 1)) * 100)
    role_score = score_role_fit(candidate.get("desired_role", ""), job.get("title", ""), job.get("description", ""))
    experience_score = score_experience_fit(candidate.get("experience_years"), job.get("title", ""), job.get("description", ""))
    context_score = score_location_type_fit(candidate, job)

    overall = min(100, round(
        (skill_score * 0.42)
        + (role_score * 0.24)
        + (keyword_score * 0.16)
        + (experience_score * 0.10)
        + (context_score * 0.08)
    ))
    ats_score = min(100, round((skill_score * 0.75) + (keyword_score * 0.25)))

    strengths = []
    if matched_skills:
        strengths.append(f"Matched skills: {', '.join(matched_skills[:5])}")
    if keyword_overlap:
        strengths.append(f"Relevant keywords present: {', '.join(sorted(keyword_overlap)[:5])}")
    if role_score >= 55:
        strengths.append("Desired role aligns closely with the job title")

    concerns = []
    if missing_skills:
        concerns.append(f"Missing requested skills: {', '.join(missing_skills[:5])}")
    if not matched_skills:
        concerns.append("No direct skill overlap detected from the provided profile")

    return {
        "match_percentage": overall,
        "ats_score": ats_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "concerns": concerns,
        "keyword_overlap": sorted(keyword_overlap),
    }


def analyze_resume(candidate: dict) -> dict:
    candidate_text = build_candidate_text(candidate)
    extracted_skills = sorted(set(normalize_skill(skill) for skill in candidate.get("skills") or []))
    inferred_keywords = extract_keywords(candidate_text, limit=12)
    ats_score = min(100, 35 + len(extracted_skills) * 6 + len(inferred_keywords) * 2)

    improvements = []
    if len(extracted_skills) < 4:
        improvements.append("Add more role-specific skills to improve ATS visibility")
    if len(str(candidate.get("summary", "")).split()) < 20:
        improvements.append("Expand the professional summary with measurable experience")
    if not candidate.get("resume_text"):
        improvements.append("Resume text was not provided, so analysis is based on profile fields only")

    return {
        "ats_score": ats_score,
        "extracted_skills": extracted_skills,
        "keywords": inferred_keywords,
        "improvements": improvements,
    }
