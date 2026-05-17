import os

from fastapi.testclient import TestClient

os.environ.setdefault('FASTAPI_INTERNAL_SERVICE_TOKEN', 'test-fastapi-token')

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
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) == 2
    assert payload[0]['title'] == 'Frontend Developer'
    assert payload[0]['match'] >= payload[1]['match']
    assert 'matched_skills' in payload[0]
    assert 'missing_skills' in payload[0]


def test_match_jobs_route_rejects_missing_internal_token():
    client = TestClient(app)
    response = client.post(
        '/match-jobs',
        json={
            'skills': ['react'],
            'experience': 'junior',
        },
    )
    assert response.status_code == 401


def test_match_jobs_route_rejects_invalid_internal_token():
    client = TestClient(app)
    response = client.post(
        '/match-jobs',
        json={
            'skills': ['react'],
            'experience': 'junior',
        },
        headers={'x-internal-service-token': 'invalid-token'},
    )
    assert response.status_code == 401


def test_match_jobs_route_accepts_bearer_internal_token(monkeypatch):
    async def fake_fetch_open_jobs(limit: int = 120):
        return [
            {
                'id': 101,
                'title': 'Frontend Developer',
                'description': 'React and JavaScript role for UI delivery.',
                'skills': ['react', 'javascript', 'css'],
            },
        ]

    monkeypatch.setattr('app.routers.match_jobs.fetch_open_jobs', fake_fetch_open_jobs)

    client = TestClient(app)
    response = client.post(
        '/match-jobs',
        json={
            'skills': ['react'],
            'experience': 'junior',
        },
        headers={'authorization': f"Bearer {os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']}"},
    )

    assert response.status_code == 200


def test_match_jobs_route_personalizes_scores_by_candidate(monkeypatch):
    async def fake_fetch_open_jobs(limit: int = 120):
        return [
            {
                'id': 501,
                'title': 'Frontend Developer',
                'description': 'Build React and Next.js UI',
                'skills': ['react', 'next.js', 'typescript'],
            },
        ]

    monkeypatch.setattr('app.routers.match_jobs.fetch_open_jobs', fake_fetch_open_jobs)
    client = TestClient(app)

    web_response = client.post(
        '/match-jobs',
        json={
            'skills': [],
            'experience': 'mid',
            'candidate': {
                'desired_role': 'Web Application Developer',
                'skills': ['react', 'next.js'],
                'summary': 'Frontend developer focused on web apps',
            },
        },
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )
    security_response = client.post(
        '/match-jobs',
        json={
            'skills': [],
            'experience': 'mid',
            'candidate': {
                'desired_role': 'Cybersecurity Analyst',
                'skills': ['siem', 'soc'],
                'summary': 'Security operations',
            },
        },
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )

    assert web_response.status_code == 200
    assert security_response.status_code == 200
    web_score = web_response.json()[0]['match']
    security_score = security_response.json()[0]['match']
    assert web_score > security_score
