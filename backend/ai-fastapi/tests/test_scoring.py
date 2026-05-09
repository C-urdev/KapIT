from app.services.scoring import compute_match


def _candidate(role: str, skills: list[str], years: int = 3):
    return {
        "id": "u-1",
        "name": "Dev",
        "desired_role": role,
        "summary": "Build web apps",
        "skills": skills,
        "location": "philippines cavite",
        "experience_years": years,
    }


def _job(job_id: int, title: str, description: str, skills: list[str]):
    return {
        "id": job_id,
        "title": title,
        "description": description,
        "location": "remote",
        "type": "Full-time",
        "skills": skills,
    }


def test_fullstack_scores_higher_for_related_web_roles():
    candidate = _candidate("Full Stack Developer", ["React", "Node.js", "TypeScript", "Express"])

    related_jobs = [
        _job(1, "Frontend Developer", "Build React and Next.js UI", ["React", "Next.js", "TypeScript"]),
        _job(2, "Web Developer", "Build web applications using JavaScript", ["JavaScript", "React"]),
        _job(3, "Software Engineer", "Design and build fullstack web systems", ["Node.js", "TypeScript"]),
        _job(4, "Backend Developer", "Build APIs with Node and Express", ["Node.js", "Express"]),
    ]
    unrelated_job = _job(5, "Graphic Designer", "Create brand assets in Figma and Photoshop", ["Figma", "Photoshop"])

    related_scores = [compute_match(candidate, job)["match_percentage"] for job in related_jobs]
    unrelated_score = compute_match(candidate, unrelated_job)["match_percentage"]

    assert min(related_scores) > unrelated_score


def test_similar_skills_count_toward_match():
    candidate = _candidate("Frontend Developer", ["React", "JavaScript"])
    job = _job(1, "Frontend Engineer", "Build app with Next.js and TypeScript", ["Next.js", "TypeScript"])

    score = compute_match(candidate, job)["match_percentage"]
    assert score >= 45


def test_match_changes_when_profile_or_job_changes():
    base_candidate = _candidate("Frontend Developer", ["React", "JavaScript"], years=2)
    better_candidate = _candidate("Frontend Developer", ["React", "JavaScript", "Next.js", "TypeScript"], years=4)
    base_job = _job(1, "Frontend Developer", "React UI work", ["React", "CSS"])
    updated_job = _job(1, "Frontend Developer", "React + Next.js + TypeScript UI work", ["React", "Next.js", "TypeScript"])

    base_score = compute_match(base_candidate, base_job)["match_percentage"]
    better_profile_score = compute_match(better_candidate, base_job)["match_percentage"]
    updated_job_score = compute_match(base_candidate, updated_job)["match_percentage"]

    assert better_profile_score != base_score
    assert updated_job_score != base_score

