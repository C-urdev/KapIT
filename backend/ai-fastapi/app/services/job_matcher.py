from __future__ import annotations

from typing import Any

from app.services.scoring import compute_match

EXPERIENCE_YEARS_BY_LEVEL = {
    "intern": 0,
    "junior": 2,
    "mid": 4,
    "senior": 7,
}


def normalize_skill(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def normalize_skills(skills: list[str] | None) -> list[str]:
    if not skills:
        return []
    normalized = [normalize_skill(item) for item in skills if normalize_skill(item)]
    return sorted(set(normalized))


def _normalize_experience_level(experience: str | None) -> str:
    normalized = normalize_skill(experience or "")
    if normalized in EXPERIENCE_YEARS_BY_LEVEL:
        return normalized
    return "junior"


def _coerce_candidate_profile(candidate_profile: dict[str, Any] | None) -> dict[str, Any]:
    return candidate_profile if isinstance(candidate_profile, dict) else {}


def _build_candidate_payload(
    *,
    skills: list[str],
    experience: str,
    candidate_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_profile = _coerce_candidate_profile(candidate_profile)
    normalized_skills = normalize_skills(skills)
    profile_skills = normalize_skills(normalized_profile.get("skills") if isinstance(normalized_profile.get("skills"), list) else [])
    merged_skills = sorted(set(normalized_skills).union(profile_skills))[:80]

    level = _normalize_experience_level(experience)
    fallback_years = EXPERIENCE_YEARS_BY_LEVEL.get(level, 2)
    experience_years_raw = normalized_profile.get("experience_years")
    try:
        experience_years = int(float(experience_years_raw)) if experience_years_raw is not None else fallback_years
    except (TypeError, ValueError):
        experience_years = fallback_years

    return {
        "id": normalized_profile.get("id") or "",
        "name": normalized_profile.get("name") or normalized_profile.get("username") or "",
        "desired_role": normalized_profile.get("desired_role") or normalized_profile.get("preferred_role") or "",
        "summary": normalized_profile.get("summary") or "",
        "resume_text": normalized_profile.get("resume_text") or "",
        "skills": merged_skills,
        "location": normalized_profile.get("location") or "",
        "preferred_type": normalized_profile.get("preferred_type") or "",
        "experience_years": experience_years,
        "account_type": normalized_profile.get("account_type") or "",
        "education": normalized_profile.get("education") or "",
        "certifications": normalized_profile.get("certifications") or "",
        "projects": normalized_profile.get("projects") or [],
        "preferred_categories": normalized_profile.get("preferred_categories") or [],
        "tech_stack": normalized_profile.get("tech_stack") or [],
    }


def build_job_matches(
    skills: list[str],
    experience: str,
    jobs: list[dict],
    candidate_profile: dict[str, Any] | None = None,
) -> list[dict]:
    candidate_payload = _build_candidate_payload(
        skills=skills,
        experience=experience,
        candidate_profile=candidate_profile,
    )
    matches = []
    for job in jobs:
        score = compute_match(candidate_payload, job)
        fit = int(score.get("fit_score") or score.get("match_percentage") or 0)
        matches.append({
            "id": int(job.get("id")) if job.get("id") is not None else None,
            "title": str(job.get("title") or "Untitled job"),
            "match": fit,
            "fit_score": fit,
            "fit_label": score.get("fit_label") or "Partial Match",
            "confidence_score": int(score.get("confidence_score") or 0),
            "confidence_label": score.get("confidence_label") or "Low",
            "role_relevance": int(score.get("role_relevance") or 0),
            "reasoning_summary": score.get("reasoning_summary") or "",
            "matched_skills": score.get("matched_skills") or [],
            "missing_skills": score.get("missing_skills") or [],
            "strengths": score.get("strengths") or [],
            "concerns": score.get("concerns") or [],
            "keyword_overlap": score.get("keyword_overlap") or [],
            "data_gaps": score.get("data_gaps") or [],
            "source": "ai",
            "insufficient_data": bool(score.get("insufficient_data")),
        })
    matches.sort(key=lambda item: item["match"], reverse=True)
    return matches
