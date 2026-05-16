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

    related_scores = [compute_match(candidate, job)["fit_score"] for job in related_jobs]
    unrelated_score = compute_match(candidate, unrelated_job)["fit_score"]

    assert min(related_scores) > unrelated_score


def test_similar_skills_count_toward_match():
    candidate = _candidate("Frontend Developer", ["React", "JavaScript"])
    job = _job(1, "Frontend Engineer", "Build app with Next.js and TypeScript", ["Next.js", "TypeScript"])

    score = compute_match(candidate, job)
    assert score["fit_score"] >= 45
    assert score["confidence_score"] >= 35
    assert score["role_relevance"] >= 35


def test_match_changes_when_profile_or_job_changes():
    base_candidate = _candidate("Frontend Developer", ["React", "JavaScript"], years=2)
    better_candidate = _candidate("Frontend Developer", ["React", "JavaScript", "Next.js", "TypeScript"], years=4)
    base_job = _job(1, "Frontend Developer", "React UI work", ["React", "CSS"])
    updated_job = _job(1, "Frontend Developer", "React + Next.js + TypeScript UI work", ["React", "Next.js", "TypeScript"])

    base_score = compute_match(base_candidate, base_job)["fit_score"]
    better_profile_score = compute_match(better_candidate, base_job)["fit_score"]
    base_job_match = compute_match(base_candidate, base_job)
    updated_job = compute_match(base_candidate, updated_job)

    assert better_profile_score >= base_score
    assert updated_job["confidence_score"] >= 35
    assert updated_job["confidence_score"] > base_job_match["confidence_score"]


def test_same_job_scores_differ_for_different_users():
    job = _job(9, "Frontend Developer", "Build React and Next.js product UI", ["React", "Next.js", "TypeScript"])
    web_candidate = _candidate("Web Application Developer", ["React", "JavaScript", "Next.js"], years=4)
    security_candidate = _candidate("Cybersecurity Analyst", ["SIEM", "SOC", "Python"], years=4)

    web_score = compute_match(web_candidate, job)["fit_score"]
    security_score = compute_match(security_candidate, job)["fit_score"]

    assert web_score > security_score


def test_insufficient_data_returns_neutral_fit_label():
    candidate = {
        "id": "u-2",
        "name": "Unknown",
        "desired_role": "",
        "summary": "",
        "skills": [],
        "resume_text": "",
        "experience_years": None,
    }
    job = _job(11, "Product Manager", "Coordinate product roadmap with analytics", ["roadmap", "analytics"])
    result = compute_match(candidate, job)

    assert result["fit_label"] == "Insufficient Data"
    assert result["confidence_label"] == "Low"


def test_profile_completed_keeps_fit_label_even_with_sparse_optional_data():
    candidate = {
        "id": "u-2b",
        "name": "Known",
        "profile_completed": True,
        "desired_role": "",
        "summary": "",
        "skills": [],
        "resume_text": "",
        "experience_years": None,
    }
    job = _job(12, "Product Manager", "Coordinate product roadmap with analytics", ["roadmap", "analytics"])
    result = compute_match(candidate, job)

    assert result["insufficient_data"] is False
    assert result["fit_label"] != "Insufficient Data"
    assert result["confidence_label"] == "Low"


def test_profile_completed_related_role_gets_reasonable_floor_even_with_sparse_skills():
    candidate = {
        "id": "u-floor-1",
        "name": "Web Candidate",
        "profile_completed": True,
        "desired_role": "Web Application Developer",
        "summary": "",
        "resume_text": "",
        "skills": [],
        "experience_years": 0,
        "education": "BS Information Technology",
        "certifications": "",
        "location": "Remote",
    }
    job = _job(
        13,
        "Frontend Developer",
        "Build and improve UI using HTML, CSS, JavaScript, React, and Next.js.",
        ["HTML", "CSS", "JavaScript", "React", "Next.js"],
    )

    result = compute_match(candidate, job)
    assert result["fit_score"] >= 38
    assert result["role_relevance"] >= 42


def test_related_web_roles_still_score_higher_than_unrelated_with_sparse_profiles():
    candidate = {
        "id": "u-rjay",
        "name": "Not Jay",
        "desired_role": "Web Application Developer",
        "summary": "",
        "resume_text": "",
        "skills": [],
        "location": "Naic, Cavite, Philippines",
        "experience_years": 0,
        "education": "Bachelor of Science in Information Technology",
        "certifications": "",
    }
    job = {
        "id": 21,
        "title": "Web Developer",
        "description": "Build and maintain web applications using HTML, CSS, JavaScript, React, and Next.js.",
        "location": "",
        "type": "Freelance",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Next.js"],
    }

    unrelated_job = {
        "id": 22,
        "title": "Cybersecurity Analyst",
        "description": "Monitor SIEM alerts and handle incident response.",
        "location": "",
        "type": "Freelance",
        "skills": ["SIEM", "SOC", "Threat Hunting"],
    }

    related_result = compute_match(candidate, job)
    unrelated_result = compute_match(candidate, unrelated_job)
    assert related_result["fit_score"] > unrelated_result["fit_score"]
    assert related_result["role_relevance"] > unrelated_result["role_relevance"]


def test_related_roles_show_meaningful_score_spread_for_specialized_profile():
    candidate = {
        "id": "u-web-1",
        "name": "Web Specialist",
        "desired_role": "Web Application Developer",
        "summary": "Frontend-focused web developer building React and Next.js interfaces with API integration.",
        "resume_text": "Built responsive UI, reusable components, and API integrations in production.",
        "skills": ["React", "Next.js", "Tailwind", "JavaScript", "APIs"],
        "tech_stack": ["React", "Next.js", "Tailwind", "TypeScript"],
        "projects": ["Ecommerce UI with Next.js and API integration"],
        "preferred_categories": ["software engineering", "frontend"],
        "experience_years": 4,
        "location": "Remote",
    }
    jobs = [
        _job(31, "Frontend Developer", "Build React and Next.js UI with Tailwind", ["React", "Next.js", "Tailwind", "TypeScript"]),
        _job(32, "Web Developer", "Build web applications using JavaScript and React", ["JavaScript", "React", "HTML", "CSS"]),
        _job(33, "Software Engineer", "Build general backend services and internal platforms", ["Python", "SQL", "Docker"]),
    ]

    frontend_score = compute_match(candidate, jobs[0])["fit_score"]
    web_score = compute_match(candidate, jobs[1])["fit_score"]
    software_score = compute_match(candidate, jobs[2])["fit_score"]

    assert frontend_score > web_score > software_score
    assert (frontend_score - software_score) >= 20


def test_fit_score_and_confidence_are_separate_signals():
    complete_candidate = {
        "id": "u-c1",
        "name": "Complete",
        "desired_role": "Frontend Developer",
        "summary": "Builds product UI in React and Next.js with measurable outcomes.",
        "resume_text": "Delivered React and Next.js releases, reduced load time, improved UX.",
        "skills": ["React", "Next.js", "TypeScript", "Tailwind"],
        "projects": ["React dashboard", "Next.js storefront"],
        "education": "BS Information Technology",
        "certifications": "AWS CCP",
        "experience_years": 4,
        "location": "Remote",
    }
    sparse_candidate = {
        "id": "u-c2",
        "name": "Sparse",
        "desired_role": "Frontend Developer",
        "summary": "",
        "resume_text": "",
        "skills": ["React", "Next.js", "TypeScript", "Tailwind"],
        "projects": [],
        "education": "",
        "certifications": "",
        "experience_years": 4,
        "location": "Remote",
    }
    job = _job(41, "Frontend Developer", "Build React and Next.js UI with TypeScript and Tailwind", ["React", "Next.js", "TypeScript", "Tailwind"])

    complete_result = compute_match(complete_candidate, job)
    sparse_result = compute_match(sparse_candidate, job)

    assert abs(complete_result["fit_score"] - sparse_result["fit_score"]) <= 12
    assert complete_result["confidence_score"] > sparse_result["confidence_score"]


def test_calibrated_frontend_profile_distribution_targets():
    candidate = {
        "id": "u-cal-1",
        "name": "Calibrated Web Dev",
        "desired_role": "Web Application Developer",
        "summary": "Build modern web applications with React, Next.js, API integrations, and Tailwind.",
        "resume_text": "Delivered frontend features, integrated APIs, and shipped user-facing improvements.",
        "skills": ["React", "Next.js", "APIs", "Tailwind", "JavaScript"],
        "tech_stack": ["React", "Next.js", "Tailwind", "TypeScript"],
        "projects": ["Built product UI and API-driven dashboards"],
        "preferred_categories": ["software engineering", "frontend"],
        "experience_years": 4,
        "location": "Remote",
    }

    jobs = {
        "frontend": _job(51, "Frontend Developer", "Build React and Next.js UI with Tailwind and reusable components.", ["React", "Next.js", "Tailwind", "TypeScript"]),
        "web": _job(52, "Web Developer", "Build and maintain web applications using JavaScript and React.", ["JavaScript", "React", "HTML", "CSS"]),
        "fullstack": _job(53, "Full Stack Developer", "Build frontend and backend features, APIs, and integrations.", ["React", "Node.js", "APIs", "SQL"]),
        "software": _job(54, "Software Engineer", "Design and build software systems across product features and services.", ["JavaScript", "Git", "Testing"]),
        "backend": _job(55, "Backend Developer", "Build backend APIs and data services.", ["Node.js", "APIs", "PostgreSQL"]),
        "security": _job(56, "Cybersecurity Analyst", "Monitor SIEM alerts and handle incidents.", ["SIEM", "SOC", "Threat Hunting"]),
    }

    scores = {name: compute_match(candidate, job)["fit_score"] for name, job in jobs.items()}

    assert 82 <= scores["frontend"] <= 90
    assert 70 <= scores["web"] <= 84
    assert 66 <= scores["fullstack"] <= 80
    assert 50 <= scores["software"] <= 60
    assert 46 <= scores["backend"] <= 62
    assert 5 <= scores["security"] <= 15
    assert scores["frontend"] > scores["web"] > scores["fullstack"] > scores["software"] > scores["backend"] > scores["security"]
