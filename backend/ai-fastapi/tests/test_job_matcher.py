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
    assert matches[0]['match'] >= 45
    assert matches[0]['matched_skills'] == ['javascript', 'react']
    assert matches[0]['missing_skills'] == ['node']


def test_empty_candidate_skills_returns_zero_or_low_match():
    jobs = [
        {
            'id': 2,
            'title': 'Backend Developer',
            'description': 'APIs, postgres, scaling and monitoring.',
            'skills': ['python', 'postgresql'],
        }
    ]

    matches = build_job_matches([], 'mid', jobs)

    assert len(matches) == 1
    assert matches[0]['match'] <= 10
    assert matches[0]['matched_skills'] == []
    assert matches[0]['missing_skills'] == ['postgresql', 'python']


def test_results_are_sorted_descending_by_match():
    jobs = [
        {'id': 11, 'title': 'Role A', 'description': '', 'skills': ['react']},
        {'id': 12, 'title': 'Role B', 'description': '', 'skills': ['go', 'kubernetes']},
    ]

    matches = build_job_matches(['react'], 'junior', jobs)

    assert matches[0]['id'] == 11
    assert matches[0]['match'] >= matches[1]['match']
