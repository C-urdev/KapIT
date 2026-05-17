from app.services.job_matcher import build_job_matches


def test_required_skills_have_higher_weight_than_optional_keywords():
    jobs = [
        {
            'id': 1,
            'title': 'Frontend Developer',
            'description': 'Build dashboards with analytics and collaboration tooling.',
            'skills': ['react', 'javascript', 'node'],
        }
    ]

    matches = build_job_matches(['react', 'javascript'], 'junior', jobs)

    assert len(matches) == 1
    assert matches[0]['match'] >= 48
    assert 'javascript' in matches[0]['matched_skills']
    assert 'react' in matches[0]['matched_skills']
    assert 'node' not in matches[0]['missing_skills']
    assert matches[0]['confidence_score'] >= 30


def test_empty_candidate_skills_returns_weaker_match_than_populated_profile():
    jobs = [
        {
            'id': 2,
            'title': 'Backend Developer',
            'description': 'APIs, postgres, scaling and monitoring.',
            'skills': ['python', 'postgresql'],
        }
    ]

    empty_matches = build_job_matches([], 'mid', jobs)
    skilled_matches = build_job_matches(['python', 'postgresql'], 'mid', jobs)

    assert len(empty_matches) == 1
    assert empty_matches[0]['matched_skills'] == []
    assert empty_matches[0]['missing_skills'] == ['postgresql', 'python']
    assert skilled_matches[0]['match'] > empty_matches[0]['match']
    assert skilled_matches[0]['confidence_score'] >= empty_matches[0]['confidence_score']


def test_results_are_sorted_descending_by_match():
    jobs = [
        {'id': 11, 'title': 'Role A', 'description': '', 'skills': ['react']},
        {'id': 12, 'title': 'Role B', 'description': '', 'skills': ['go', 'kubernetes']},
    ]

    matches = build_job_matches(['react'], 'junior', jobs)

    assert matches[0]['id'] == 11
    assert matches[0]['match'] >= matches[1]['match']


def test_candidate_profile_changes_the_scores_for_same_job():
    jobs = [
        {'id': 41, 'title': 'Frontend Developer', 'description': 'React + Next.js product work', 'skills': ['react', 'next.js']},
    ]
    web_profile = {'desired_role': 'Web Application Developer', 'skills': ['react', 'next.js', 'javascript']}
    security_profile = {'desired_role': 'Cybersecurity Analyst', 'skills': ['siem', 'soc', 'python']}

    web_match = build_job_matches([], 'mid', jobs, candidate_profile=web_profile)[0]
    security_match = build_job_matches([], 'mid', jobs, candidate_profile=security_profile)[0]

    assert web_match['match'] > security_match['match']
