from __future__ import annotations

import re
from collections import Counter
from typing import Iterable


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9\+\#\.\-]{2,}")


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


def compute_match(candidate: dict, job: dict) -> dict:
    candidate_skills = candidate.get("skills") or []
    job_skills = job.get("skills") or []
    candidate_text = build_candidate_text(candidate)
    job_text = build_job_text(job)

    candidate_keywords = set(extract_keywords(candidate_text, limit=30))
    job_keywords = set(extract_keywords(job_text, limit=30))
    keyword_overlap = candidate_keywords.intersection(job_keywords)

    skill_score = score_overlap(candidate_skills, job_skills)
    keyword_score = round((len(keyword_overlap) / max(len(job_keywords), 1)) * 100)

    desired_role = normalize_skill(candidate.get("desired_role", ""))
    title = normalize_skill(job.get("title", ""))
    title_bonus = 10 if desired_role and desired_role in title else 0

    overall = min(100, round(skill_score * 0.65 + keyword_score * 0.25 + title_bonus))
    ats_score = min(100, round(skill_score * 0.7 + keyword_score * 0.3))

    matched_skills = sorted(
        set(normalize_skill(skill) for skill in candidate_skills).intersection(
            normalize_skill(skill) for skill in job_skills
        )
    )
    missing_skills = sorted(
        set(normalize_skill(skill) for skill in job_skills).difference(
            normalize_skill(skill) for skill in candidate_skills
        )
    )

    strengths = []
    if matched_skills:
        strengths.append(f"Matched skills: {', '.join(matched_skills[:5])}")
    if keyword_overlap:
        strengths.append(f"Relevant keywords present: {', '.join(sorted(keyword_overlap)[:5])}")
    if title_bonus:
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
