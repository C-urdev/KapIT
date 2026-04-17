from fastapi.testclient import TestClient

from main import app


def test_match_jobs_route_returns_sorted_matches_from_job_rows(monkeypatch):
    async def fake_fetch_open_jobs(limit: int = 120):
        return [
            {
                'id': 101,
                'title': 'Frontend Developer',
                'description': 'React and JavaScript role for UI delivery.',
                'skills': ['react', 'javascript', 'css'],
            },
            {
                'id': 102,
                'title': 'DevOps Engineer',
                'description': 'Kubernetes and AWS operations.',
                'skills': ['kubernetes', 'aws'],
            },
        ]

    monkeypatch.setattr('app.routers.match_jobs.fetch_open_jobs', fake_fetch_open_jobs)

    client = TestClient(app)
    response = client.post(
        '/match-jobs',
        json={
            'skills': ['react', 'javascript'],
            'experience': 'junior',
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) == 2
    assert payload[0]['title'] == 'Frontend Developer'
    assert payload[0]['match'] >= payload[1]['match']
    assert 'matched_skills' in payload[0]
    assert 'missing_skills' in payload[0]
