from __future__ import annotations

import re
from collections import Counter
from difflib import SequenceMatcher
from typing import Iterable


TOKEN_PATTERN = re.compile(r"[A-Za-z0-9\+\#\.\-]{2,}")
YEARS_PATTERN = re.compile(r"(\d{1,2})\s*\+?\s*(?:years?|yrs?)", re.IGNORECASE)
EXPERIENCE_TARGETS = {
    "intern": 0,
    "entry": 1,
    "junior": 2,
    "mid": 4,
    "intermediate": 4,
    "senior": 7,
    "lead": 8,
    "principal": 10,
    "staff": 9,
}
ROLE_GROUPS = {
    "software_engineering": {
        "software", "engineer", "developer", "web", "frontend", "backend", "fullstack",
        "react", "next", "javascript", "typescript", "node", "api", "application",
    },
    "cybersecurity": {
        "cybersecurity", "security", "soc", "siem", "threat", "incident", "forensics",
        "vulnerability", "penetration", "pentest", "iam", "zero", "trust",
    },
    "ai_ml": {
        "ai", "ml", "machine", "learning", "llm", "nlp", "deep", "neural", "model",
        "data", "scientist", "computer", "vision", "prompt",
    },
    "devops_cloud": {
        "devops", "sre", "cloud", "aws", "azure", "gcp", "kubernetes", "docker",
        "terraform", "ci", "cd", "infrastructure", "platform",
    },
    "networking": {
        "network", "networking", "routing", "switching", "firewall", "lan", "wan",
        "cisco", "juniper", "nac", "wireless",
    },
    "data_analytics": {
        "data", "analytics", "bi", "warehouse", "etl", "sql", "tableau", "powerbi",
        "insight", "reporting",
    },
    "finance_accounting": {
        "finance", "financial", "accounting", "bookkeeping", "audit", "tax", "payroll",
        "controller", "accounts", "fp&a",
    },
    "hr_people": {
        "hr", "human", "recruiter", "recruitment", "talent", "people", "benefits",
        "compensation", "onboarding",
    },
    "ui_ux_design": {
        "ui", "ux", "designer", "design", "figma", "wireframe", "prototype", "usability",
        "interaction", "visual",
    },
    "marketing_growth": {
        "marketing", "seo", "sem", "content", "copywriting", "campaign", "brand",
        "social", "growth", "email",
    },
    "healthcare_it": {
        "healthcare", "ehr", "emr", "clinical", "patient", "hipaa", "medical", "hospital",
    },
    "product_management": {
        "product", "roadmap", "prioritization", "stakeholder", "requirements", "agile",
        "scrum", "backlog", "owner",
    },
}
SKILL_ALIASES = {
    "react": {"reactjs", "next", "next.js", "frontend", "javascript", "typescript"},
    "next.js": {"next", "react", "javascript", "typescript", "frontend"},
    "javascript": {"js", "typescript", "react", "node", "node.js"},
    "typescript": {"ts", "javascript", "react", "node", "next.js"},
    "node.js": {"node", "javascript", "express", "backend"},
    "node": {"node.js", "javascript", "express", "backend"},
    "python": {"django", "flask", "fastapi", "data"},
    "aws": {"cloud", "devops"},
    "kubernetes": {"k8s", "devops", "docker", "cloud"},
    "ui": {"ux", "figma", "design"},
    "ux": {"ui", "research", "design"},
}
STOP_WORDS = {
    "with", "from", "this", "that", "your", "have", "will", "must", "able", "into", "role",
    "team", "work", "year", "years", "using", "experience", "developer", "engineer", "company",
    "candidate", "skills", "skill", "required", "preferred", "strong", "good", "plus",
}
SPECIALIZATION_FOCUS = {
    "software_general": {"software", "engineer", "developer", "web", "application", "fullstack", "frontend", "backend"},
    "frontend": {"frontend", "ui", "ux", "react", "next", "next.js", "javascript", "typescript", "css", "tailwind"},
    "backend": {"backend", "api", "node", "node.js", "express", "fastapi", "django", "spring", "golang", "java", "python"},
    "security": {"security", "cybersecurity", "soc", "siem", "threat", "incident", "forensics", "penetration", "pentest", "iam"},
    "devops": {"devops", "sre", "kubernetes", "docker", "terraform", "ci", "cd", "cloud", "aws", "azure", "gcp"},
    "data": {"data", "analytics", "etl", "warehouse", "sql", "tableau", "powerbi", "bi", "scientist"},
    "ml_ai": {"ml", "ai", "machine", "learning", "nlp", "llm", "deep", "neural", "vision", "model"},
    "ui_ux": {"ui", "ux", "design", "figma", "wireframe", "prototype", "interaction", "usability"},
    "networking": {"network", "networking", "routing", "switching", "firewall", "lan", "wan", "cisco", "juniper"},
}
CRITICAL_HINT_PATTERN = re.compile(r"\b(must|required|mandatory|essential|core)\b", re.IGNORECASE)
PROGRAMMING_MARKERS = {
    "javascript", "typescript", "python", "java", "c#", "golang", "go", "php", "ruby", "node", "node.js",
    "react", "next", "next.js", "api", "apis", "sql", "postgresql", "mysql", "mongodb", "git", "express",
}


def normalize_skill(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_PATTERN.findall(str(text or ""))]


def _as_text_list(value: object, *, split_commas: bool = True) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        result: list[str] = []
        for item in value:
            result.extend(_as_text_list(item, split_commas=split_commas))
        return result

    raw = str(value).strip()
    if not raw:
        return []
    if split_commas:
        parts = re.split(r"[,\n;/]+", raw)
        return [part.strip() for part in parts if part.strip()]
    return [raw]


def _build_candidate_text(candidate: dict) -> str:
    parts = [
        candidate.get("desired_role", ""),
        candidate.get("summary", ""),
        candidate.get("resume_text", ""),
        candidate.get("education", ""),
        candidate.get("certifications", ""),
        " ".join(_as_text_list(candidate.get("skills"))),
        " ".join(_as_text_list(candidate.get("projects"))),
        " ".join(_as_text_list(candidate.get("preferred_categories"))),
        " ".join(_as_text_list(candidate.get("tech_stack"))),
        candidate.get("location", ""),
    ]
    return " ".join(str(part) for part in parts if part).strip()


def _build_job_text(job: dict) -> str:
    parts = [
        job.get("title", ""),
        job.get("description", ""),
        " ".join(_as_text_list(job.get("skills"))),
        " ".join(_as_text_list(job.get("technologies"))),
        " ".join(_as_text_list(job.get("keywords"))),
        " ".join(_as_text_list(job.get("tags"))),
        job.get("industry", ""),
        job.get("category", ""),
        job.get("seniority", ""),
        job.get("location", ""),
        job.get("type", ""),
    ]
    return " ".join(str(part) for part in parts if part).strip()


def _extract_keywords(text: str, limit: int = 25) -> list[str]:
    counts = Counter(
        token
        for token in tokenize(text)
        if token not in STOP_WORDS and len(token) > 2
    )
    return [word for word, _ in counts.most_common(limit)]


def _expand_with_skill_aliases(skills: set[str]) -> set[str]:
    expanded = set(skills)
    for skill in list(skills):
        expanded.update(SKILL_ALIASES.get(skill, set()))
    return expanded


def _detect_role_groups(tokens: set[str]) -> dict[str, float]:
    weights: dict[str, float] = {}
    for group_name, aliases in ROLE_GROUPS.items():
        overlap = tokens.intersection(aliases)
        if not overlap:
            continue
        weights[group_name] = len(overlap) / max(len(aliases), 1)
    return weights


def _ratio_overlap(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left.intersection(right)) / max(len(right), 1)


def _jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    union = left.union(right)
    if not union:
        return 0.0
    return len(left.intersection(right)) / len(union)


def _parse_job_skill_sets(job: dict) -> tuple[set[str], set[str], set[str]]:
    required_skills = {
        normalize_skill(item)
        for item in (
            _as_text_list(job.get("skills"))
            + _as_text_list(job.get("technologies"))
            + _as_text_list(job.get("required_skills"))
        )
        if normalize_skill(item)
    }
    preferred_skills = {
        normalize_skill(item)
        for item in (
            _as_text_list(job.get("preferred_skills"))
            + _as_text_list(job.get("keywords"))
            + _as_text_list(job.get("tags"))
        )
        if normalize_skill(item)
    }.difference(required_skills)

    title_tokens = set(tokenize(job.get("title", "")))
    description_text = normalize_skill(job.get("description", ""))
    has_critical_hint = bool(CRITICAL_HINT_PATTERN.search(description_text))
    critical_skills = {
        skill
        for skill in required_skills
        if set(tokenize(skill)).intersection(title_tokens)
    }
    if has_critical_hint:
        for skill in required_skills:
            if skill in description_text:
                critical_skills.add(skill)
    return required_skills, preferred_skills, critical_skills


def _score_skill_fit(candidate: dict, job: dict) -> tuple[int, list[str], list[str], list[str], float, dict[str, float]]:
    candidate_skills = {
        normalize_skill(item)
        for item in (
            _as_text_list(candidate.get("skills"))
            + _as_text_list(candidate.get("tech_stack"))
        )
        if normalize_skill(item)
    }
    required_skills, preferred_skills, critical_skills = _parse_job_skill_sets(job)

    if not required_skills:
        candidate_keywords = set(_extract_keywords(_build_candidate_text(candidate), limit=35))
        job_keywords = set(_extract_keywords(_build_job_text(job), limit=35))
        overlap = candidate_keywords.intersection(job_keywords)
        score = 32 if not job_keywords else min(84, round(30 + (len(overlap) / max(len(job_keywords), 1)) * 54))
        return score, sorted(overlap)[:12], [], [], 0.35, {
            "required_coverage": 0.0,
            "preferred_coverage": 0.0,
            "stack_similarity": 0.0,
        }

    expanded_candidate = _expand_with_skill_aliases(candidate_skills)
    direct = required_skills.intersection(candidate_skills)
    semantic = required_skills.intersection(expanded_candidate).difference(direct)
    required_coverage = (len(direct) + (len(semantic) * 0.55)) / max(len(required_skills), 1)

    candidate_markers = set(candidate_skills).intersection(PROGRAMMING_MARKERS)
    required_markers = set(required_skills).intersection(PROGRAMMING_MARKERS)
    transferable_programming_coverage = 0.0
    if required_coverage < 0.35 and len(candidate_markers) >= 2 and len(required_markers) >= 2:
        transferable_programming_coverage = min(
            0.26,
            0.10 + (min(len(candidate_markers), len(required_markers)) * 0.04)
        )
        required_coverage = max(required_coverage, transferable_programming_coverage)

    preferred_direct = preferred_skills.intersection(candidate_skills)
    preferred_semantic = preferred_skills.intersection(expanded_candidate).difference(preferred_direct)
    preferred_coverage = (len(preferred_direct) + (len(preferred_semantic) * 0.35)) / max(len(preferred_skills), 1) if preferred_skills else 0.0
    stack_similarity = _jaccard_similarity(expanded_candidate, required_skills.union(preferred_skills))

    raw_skill_score = (required_coverage * 0.78) + (preferred_coverage * 0.14) + (stack_similarity * 0.08)
    score = min(100, round(max(0.0, raw_skill_score) * 100))

    matched = sorted(direct.union(semantic).union(preferred_direct).union(preferred_semantic))
    missing = sorted(required_skills.difference(direct.union(semantic)))
    missing_critical = sorted(set(missing).intersection(critical_skills))
    confidence_signal = min(
        1.0,
        0.22
        + (required_coverage * 0.60)
        + (preferred_coverage * 0.12)
        + (0.12 if len(direct) >= 2 else 0)
    )
    return score, matched, missing, missing_critical, confidence_signal, {
        "required_coverage": required_coverage,
        "preferred_coverage": preferred_coverage,
        "stack_similarity": stack_similarity,
        "transferable_programming_coverage": transferable_programming_coverage,
    }


def _score_role_fit(candidate: dict, job: dict) -> tuple[int, int, dict[str, float], set[str]]:
    candidate_role = normalize_skill(candidate.get("desired_role", ""))
    candidate_role_tokens = set(tokenize(candidate_role))
    job_role_text = normalize_skill(
        f"{job.get('title', '')} {job.get('description', '')} "
        f"{job.get('category', '')} {job.get('industry', '')} {job.get('tags', '')}"
    )
    job_role_tokens = set(tokenize(job_role_text))

    if not candidate_role_tokens:
        return 0, 0, {
            "direct_overlap": 0.0,
            "group_alignment": 0.0,
            "category_alignment": 0.0,
            "industry_alignment": 0.0,
            "title_similarity": 0.0,
        }, set()

    direct_overlap = len(candidate_role_tokens.intersection(job_role_tokens)) / max(len(candidate_role_tokens), 1)
    candidate_group_tokens = set(tokenize(" ".join([
        str(candidate.get("desired_role", "")),
        str(candidate.get("summary", "")),
        " ".join(_as_text_list(candidate.get("skills"))),
        " ".join(_as_text_list(candidate.get("tech_stack"))),
        " ".join(_as_text_list(candidate.get("preferred_categories"))),
    ])))
    job_group_tokens = set(tokenize(" ".join([
        str(job.get("title", "")),
        str(job.get("description", "")),
        " ".join(_as_text_list(job.get("skills"))),
        " ".join(_as_text_list(job.get("technologies"))),
        str(job.get("category", "")),
        str(job.get("industry", "")),
        " ".join(_as_text_list(job.get("tags"))),
    ])))
    candidate_groups = _detect_role_groups(candidate_group_tokens)
    job_groups = _detect_role_groups(job_group_tokens)
    shared_groups = set(candidate_groups.keys()).intersection(job_groups.keys())
    group_alignment = 0.0
    if shared_groups:
        group_alignment = sum(min(candidate_groups[group], job_groups[group]) for group in shared_groups)
        group_alignment = min(1.0, group_alignment * 2.8)

    category_tokens = set(tokenize(" ".join(_as_text_list(candidate.get("preferred_categories")))))
    job_category_tokens = set(tokenize(
        f"{job.get('category', '')} {job.get('tags', '')} {job.get('title', '')}"
    ))
    category_alignment = _ratio_overlap(category_tokens, job_category_tokens) if category_tokens else _ratio_overlap(candidate_role_tokens, job_category_tokens)

    candidate_context_tokens = set(tokenize(_build_candidate_text(candidate)))
    industry_tokens = set(tokenize(job.get("industry", "")))
    industry_alignment = _ratio_overlap(candidate_context_tokens, industry_tokens) if industry_tokens else 0.0
    title_similarity = SequenceMatcher(None, candidate_role, normalize_skill(job.get("title", ""))).ratio()

    role_score = min(100, round(100 * (
        (direct_overlap * 0.32)
        + (group_alignment * 0.38)
        + (category_alignment * 0.12)
        + (industry_alignment * 0.08)
        + (title_similarity * 0.10)
    )))
    role_relevance = min(100, round(100 * (
        (direct_overlap * 0.30)
        + (group_alignment * 0.42)
        + (category_alignment * 0.12)
        + (industry_alignment * 0.10)
        + (title_similarity * 0.06)
    )))
    return role_score, role_relevance, {
        "direct_overlap": direct_overlap,
        "group_alignment": group_alignment,
        "category_alignment": category_alignment,
        "industry_alignment": industry_alignment,
        "title_similarity": title_similarity,
    }, shared_groups


def _shared_role_groups(candidate: dict, job: dict) -> set[str]:
    candidate_text = " ".join([
        str(candidate.get("desired_role", "")),
        " ".join(_as_text_list(candidate.get("preferred_categories"))),
        " ".join(_as_text_list(candidate.get("tech_stack"))),
    ]).strip()
    job_text = " ".join([
        str(job.get("title", "")),
        str(job.get("description", "")),
        str(job.get("category", "")),
        str(job.get("industry", "")),
        " ".join(_as_text_list(job.get("tags"))),
    ]).strip()
    candidate_groups = _detect_role_groups(set(tokenize(candidate_text)))
    job_groups = _detect_role_groups(set(tokenize(job_text)))
    return set(candidate_groups.keys()).intersection(job_groups.keys())


def _score_specialization_fit(candidate: dict, job: dict) -> tuple[int, float, dict[str, float]]:
    candidate_text = " ".join([
        str(candidate.get("desired_role", "")),
        str(candidate.get("summary", "")),
        " ".join(_as_text_list(candidate.get("skills"))),
        " ".join(_as_text_list(candidate.get("tech_stack"))),
        " ".join(_as_text_list(candidate.get("projects"))),
    ]).strip()
    job_text = " ".join([
        str(job.get("title", "")),
        str(job.get("description", "")),
        " ".join(_as_text_list(job.get("skills"))),
        " ".join(_as_text_list(job.get("technologies"))),
        " ".join(_as_text_list(job.get("keywords"))),
        str(job.get("category", "")),
    ]).strip()

    candidate_tokens = set(tokenize(candidate_text))
    job_tokens = set(tokenize(job_text))
    if not job_tokens:
        return 56, 0.35, {}

    job_focus: dict[str, float] = {}
    candidate_focus: dict[str, float] = {}
    for name, aliases in SPECIALIZATION_FOCUS.items():
        job_overlap = len(job_tokens.intersection(aliases))
        if job_overlap > 0:
            job_focus[name] = job_overlap / max(len(aliases), 1)
        candidate_overlap = len(candidate_tokens.intersection(aliases))
        if candidate_overlap > 0:
            candidate_focus[name] = candidate_overlap / max(len(aliases), 1)

    if not job_focus:
        return 58, 0.4, {}

    total_job_focus = sum(job_focus.values()) or 1.0
    weighted_alignment = 0.0
    for name, job_weight in job_focus.items():
        normalized_job_weight = job_weight / total_job_focus
        candidate_weight = candidate_focus.get(name, 0.0)
        dimension_alignment = min(1.0, candidate_weight / job_weight) if job_weight > 0 else 0.0
        weighted_alignment += normalized_job_weight * dimension_alignment

    specialization_score = min(100, round(100 * weighted_alignment))
    signal = min(1.0, 0.28 + (weighted_alignment * 0.68))
    return specialization_score, signal, job_focus


def _infer_job_target_experience_years(job: dict) -> int | None:
    text = f"{job.get('title', '')} {job.get('description', '')} {job.get('seniority', '')}"
    match = YEARS_PATTERN.search(text)
    if match:
        value = int(match.group(1))
        return max(0, min(value, 20))

    normalized = normalize_skill(text)
    for keyword, years in EXPERIENCE_TARGETS.items():
        if keyword in normalized:
            return years
    return None


def _score_experience_fit(candidate: dict, job: dict) -> tuple[int, float]:
    years_raw = candidate.get("experience_years")
    try:
        candidate_years = int(float(years_raw))
    except (TypeError, ValueError):
        return 60, 0.2

    target_years = _infer_job_target_experience_years(job)
    if target_years is None:
        return (78 if candidate_years >= 1 else 64), 0.45

    gap = abs(candidate_years - target_years)
    if gap == 0:
        return 95, 0.9
    if gap <= 1:
        return 86, 0.75
    if gap <= 3:
        return 72, 0.6
    return 56, 0.45


def _score_context_fit(candidate: dict, job: dict) -> tuple[int, float]:
    candidate_tokens = set(_extract_keywords(_build_candidate_text(candidate), limit=35))
    job_tokens = set(_extract_keywords(_build_job_text(job), limit=35))
    keyword_overlap = len(candidate_tokens.intersection(job_tokens))
    keyword_score = 40 if not job_tokens else min(100, round(35 + (keyword_overlap / max(len(job_tokens), 1)) * 65))

    profile_type = normalize_skill(candidate.get("preferred_type", ""))
    job_type = normalize_skill(job.get("type", ""))
    type_score = 70
    if profile_type and job_type:
        type_score = 95 if profile_type in job_type or job_type in profile_type else 52

    location_tokens = set(tokenize(candidate.get("location", "")))
    job_location_tokens = set(tokenize(job.get("location", "")))
    location_score = 62
    if location_tokens and job_location_tokens:
        overlap = len(location_tokens.intersection(job_location_tokens)) / max(len(job_location_tokens), 1)
        location_score = min(100, round(42 + (overlap * 58)))

    score = round((keyword_score * 0.55) + (type_score * 0.25) + (location_score * 0.20))
    confidence_signal = min(1.0, 0.35 + (0.25 if keyword_overlap else 0) + (0.2 if profile_type and job_type else 0))
    return score, confidence_signal


def _score_responsibility_fit(candidate: dict, job: dict) -> tuple[int, float, int]:
    candidate_keywords = set(_extract_keywords(_build_candidate_text(candidate), limit=45))
    job_keywords = set(_extract_keywords(_build_job_text(job), limit=45))
    if not job_keywords:
        return 48, 0.28, 0
    overlap_count = len(candidate_keywords.intersection(job_keywords))
    overlap_ratio = overlap_count / max(len(job_keywords), 1)
    jaccard = _jaccard_similarity(candidate_keywords, job_keywords)
    semantic_ratio = SequenceMatcher(
        None,
        " ".join(sorted(candidate_keywords)),
        " ".join(sorted(job_keywords)),
    ).ratio()
    score = min(100, round(100 * ((overlap_ratio * 0.62) + (jaccard * 0.23) + (semantic_ratio * 0.15))))
    confidence_signal = min(1.0, 0.25 + (overlap_ratio * 0.5) + (0.15 if overlap_count >= 4 else 0))
    return score, confidence_signal, overlap_count


def _critical_requirement_penalty(*, missing_critical_count: int, missing_total: int, required_total: int, role_relevance: int, specialization_score: int) -> int:
    if required_total <= 0:
        return 0
    missing_ratio = missing_total / max(required_total, 1)
    penalty = (missing_critical_count * 6) + round(missing_ratio * 4)
    if role_relevance < 30 and specialization_score < 35:
        penalty += 1
    return max(0, min(12, penalty))


def _weighted_average(values: list[tuple[int, float]]) -> int:
    total_weight = sum(weight for _, weight in values if weight > 0)
    if total_weight <= 0:
        return 0
    weighted_sum = sum(score * weight for score, weight in values if weight > 0)
    return max(0, min(100, round(weighted_sum / total_weight)))


def _confidence_label(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 45:
        return "Medium"
    return "Low"


def _fit_label(score: int, insufficient_data: bool) -> str:
    if insufficient_data:
        return "Insufficient Data"
    if score >= 75:
        return "Strong Match"
    if score >= 60:
        return "Good Match"
    if score >= 40:
        return "Partial Match"
    return "Weak Match"


def _compute_profile_completeness(candidate: dict) -> int:
    checks = [
        bool(normalize_skill(candidate.get("desired_role", ""))),
        bool(_as_text_list(candidate.get("skills"))),
        len(tokenize(candidate.get("summary", ""))) >= 10,
        len(tokenize(candidate.get("resume_text", ""))) >= 10,
        candidate.get("experience_years") is not None,
        bool(normalize_skill(candidate.get("education", ""))),
        bool(normalize_skill(candidate.get("certifications", ""))),
        bool(_as_text_list(candidate.get("projects"))),
    ]
    return round((sum(1 for ok in checks if ok) / len(checks)) * 100)


def compute_match(candidate: dict, job: dict) -> dict:
    candidate_text = _build_candidate_text(candidate)
    job_text = _build_job_text(job)
    candidate_keywords = set(_extract_keywords(candidate_text, limit=35))
    job_keywords = set(_extract_keywords(job_text, limit=35))
    keyword_overlap = sorted(candidate_keywords.intersection(job_keywords))

    skill_score, matched_skills, missing_skills, missing_critical_skills, skill_confidence_signal, skill_components = _score_skill_fit(candidate, job)
    role_score, role_relevance, role_components, shared_groups = _score_role_fit(candidate, job)
    experience_score, experience_signal = _score_experience_fit(candidate, job)
    context_score, context_signal = _score_context_fit(candidate, job)
    responsibility_score, responsibility_signal, responsibility_overlap_count = _score_responsibility_fit(candidate, job)
    specialization_score, specialization_signal, specialization_focus = _score_specialization_fit(candidate, job)
    required_skills, _, _ = _parse_job_skill_sets(job)

    role_weight = 0.34 if role_score > 0 else 0.0
    fit_raw = _weighted_average([
        (role_score, role_weight),
        (skill_score, 0.30),
        (experience_score, 0.12),
        (responsibility_score, 0.13),
        (specialization_score, 0.11),
    ])
    penalty = _critical_requirement_penalty(
        missing_critical_count=len(missing_critical_skills),
        missing_total=len(missing_skills),
        required_total=len(required_skills),
        role_relevance=role_relevance,
        specialization_score=specialization_score,
    )
    role_family_boost = round(role_components.get("group_alignment", 0.0) * 11)
    alignment_boost = round(max(0, role_relevance - 40) * 0.08)
    context_adjustment = round((context_score - 50) * 0.17)
    evidence_adjustment = round((experience_score * 0.04) + (context_score * 0.03)) - 4
    fit_score = max(0, min(100, fit_raw - penalty + context_adjustment + evidence_adjustment + role_family_boost + alignment_boost))

    profile_completeness = _compute_profile_completeness(candidate)
    candidate_skill_count = len({
        normalize_skill(item)
        for item in (_as_text_list(candidate.get("skills")) + _as_text_list(candidate.get("tech_stack")))
        if normalize_skill(item)
    })
    summary_token_count = len(tokenize(candidate.get("summary", "")))
    resume_token_count = len(tokenize(candidate.get("resume_text", "")))
    profile_evidence_signal = min(
        100,
        round(
            (min(12, candidate_skill_count) / 12) * 45
            + (min(60, summary_token_count) / 60) * 25
            + (min(80, resume_token_count) / 80) * 20
            + (profile_completeness * 0.10)
        )
    )
    data_strength = _weighted_average([
        (profile_completeness, 0.55),
        (profile_evidence_signal, 0.20),
        (min(100, round(skill_confidence_signal * 100)), 0.15),
        (min(100, round(((experience_signal + context_signal + responsibility_signal + specialization_signal) / 4) * 100)), 0.10),
    ])
    confidence_score = max(8, min(99, data_strength))
    low_profile_evidence = (
        candidate_skill_count < 2
        and summary_token_count < 8
        and resume_token_count < 12
    )
    insufficient_data = (
        confidence_score < 35
        or (profile_completeness < 45 and low_profile_evidence and not matched_skills)
        or (profile_completeness < 30 and not matched_skills and role_score < 35)
    )
    if low_profile_evidence:
        confidence_score = min(confidence_score, 42)
    confidence_label = _confidence_label(confidence_score)
    fit_label = _fit_label(fit_score, insufficient_data)
    ats_score = min(100, round((skill_score * 0.8) + (len(keyword_overlap) * 2.5)))

    strengths: list[str] = []
    if matched_skills:
        strengths.append(f"Matched skills: {', '.join(matched_skills[:6])}")
    if role_relevance >= 60:
        strengths.append("Role alignment is strong based on your profile and this job title")
    if keyword_overlap:
        strengths.append(f"Relevant overlap keywords: {', '.join(keyword_overlap[:6])}")

    concerns: list[str] = []
    if missing_skills:
        concerns.append(f"Missing requested skills: {', '.join(missing_skills[:6])}")
    if missing_critical_skills:
        concerns.append(f"Missing critical requirements: {', '.join(missing_critical_skills[:4])}")
    if role_relevance < 40 and normalize_skill(candidate.get("desired_role", "")):
        concerns.append("Role alignment is limited compared with your preferred role")
    if profile_completeness < 45:
        concerns.append("Profile data is incomplete, so confidence is lower")

    if insufficient_data:
        reasoning_summary = "Insufficient profile or job details for a reliable percentage. Complete your profile to improve accuracy."
    else:
        positive_bits = []
        if matched_skills:
            positive_bits.append(f"matched skills such as {', '.join(matched_skills[:4])}")
        if role_relevance >= 55:
            positive_bits.append("role alignment")
        if keyword_overlap:
            positive_bits.append(f"keyword overlap ({', '.join(keyword_overlap[:3])})")
        reduction_bits = []
        if missing_skills:
            reduction_bits.append(f"missing {', '.join(missing_skills[:3])}")
        if missing_critical_skills:
            reduction_bits.append(f"critical gaps ({', '.join(missing_critical_skills[:2])})")
        if confidence_label == "Low":
            reduction_bits.append("limited profile context")

        positive_text = ", ".join(positive_bits) if positive_bits else "some partial relevance"
        if reduction_bits:
            reasoning_summary = f"Match is driven by {positive_text}, but reduced by {', '.join(reduction_bits)}."
        else:
            reasoning_summary = f"Match is driven by {positive_text}."

    return {
        "match_percentage": fit_score,
        "fit_score": fit_score,
        "fit_label": fit_label,
        "confidence_score": confidence_score,
        "confidence_label": confidence_label,
        "role_relevance": role_relevance,
        "ats_score": ats_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "concerns": concerns,
        "keyword_overlap": keyword_overlap[:12],
        "reasoning_summary": reasoning_summary,
        "insufficient_data": insufficient_data,
        "score_breakdown": {
            "dimensions": {
                "role_relevance": role_score,
                "skill_overlap": skill_score,
                "experience_match": experience_score,
                "responsibility_match": responsibility_score,
                "specialization_fit": specialization_score,
                "context_fit": context_score,
            },
            "weights": {
                "role_relevance": role_weight,
                "skill_overlap": 0.30,
                "experience_match": 0.12,
                "responsibility_match": 0.13,
                "specialization_fit": 0.11,
            },
            "adjustments": {
                "critical_missing_penalty": penalty,
                "context_adjustment": context_adjustment,
                "evidence_adjustment": evidence_adjustment,
                "role_family_boost": role_family_boost,
                "alignment_boost": alignment_boost,
            },
            "signals": {
                "role_components": role_components,
                "skill_components": skill_components,
                "shared_role_groups": sorted(shared_groups),
                "specialization_focus": specialization_focus,
                "responsibility_overlap_count": responsibility_overlap_count,
                "missing_critical_skills": missing_critical_skills,
            },
        },
    }


def analyze_resume(candidate: dict) -> dict:
    candidate_text = _build_candidate_text(candidate)
    extracted_skills = sorted(set(normalize_skill(skill) for skill in _as_text_list(candidate.get("skills")) if normalize_skill(skill)))
    inferred_keywords = _extract_keywords(candidate_text, limit=12)
    profile_completeness = _compute_profile_completeness(candidate)
    ats_score = min(100, round((len(extracted_skills) * 7) + (len(inferred_keywords) * 2.5) + (profile_completeness * 0.35)))

    improvements: list[str] = []
    if len(extracted_skills) < 4:
        improvements.append("Add more role-specific skills to improve ATS visibility")
    if len(tokenize(candidate.get("summary", ""))) < 20:
        improvements.append("Expand your summary with measurable project outcomes")
    if len(tokenize(candidate.get("resume_text", ""))) < 20:
        improvements.append("Provide richer resume text to improve fit confidence")

    return {
        "ats_score": ats_score,
        "extracted_skills": extracted_skills,
        "keywords": inferred_keywords,
        "profile_completeness": profile_completeness,
        "improvements": improvements,
    }
