import os

from fastapi.testclient import TestClient

os.environ.setdefault('FASTAPI_INTERNAL_SERVICE_TOKEN', 'test-fastapi-token')

from main import app


def test_chatbot_message_route_returns_intent_payload():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={'message': 'helo'},
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {'reply', 'intent', 'confidence', 'actions'}
    assert isinstance(payload.get('reply'), str)
    assert payload.get('intent') == 'greeting'
    assert isinstance(payload.get('confidence'), (int, float))
    assert isinstance(payload.get('actions'), list)


def test_chatbot_message_route_rejects_missing_message():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={},
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )
    assert response.status_code == 422


def test_chatbot_message_route_rejects_blank_message():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={'message': '    '},
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )
    assert response.status_code == 422


def test_chatbot_message_route_rejects_too_long_message():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={'message': 'a' * 321},
        headers={'x-internal-service-token': os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']},
    )
    assert response.status_code == 422


def test_chatbot_message_route_rejects_missing_internal_token():
    client = TestClient(app)
    response = client.post('/api/chatbot/message', json={'message': 'hello'})
    assert response.status_code == 401


def test_chatbot_message_route_rejects_invalid_internal_token():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={'message': 'hello'},
        headers={'x-internal-service-token': 'invalid-token'},
    )
    assert response.status_code == 401


def test_chatbot_message_route_accepts_bearer_internal_token():
    client = TestClient(app)
    response = client.post(
        '/api/chatbot/message',
        json={'message': 'hello'},
        headers={'authorization': f"Bearer {os.environ['FASTAPI_INTERNAL_SERVICE_TOKEN']}"},
    )
    assert response.status_code == 200


def test_chatbot_message_route_enforces_rate_limit(monkeypatch):
    monkeypatch.setenv('FASTAPI_INTERNAL_SERVICE_TOKEN', 'rate-limit-token')
    monkeypatch.setenv('FASTAPI_RATE_LIMIT_CHATBOT_PER_MIN', '1')

    client = TestClient(app)
    headers = {'x-internal-service-token': 'rate-limit-token'}

    first = client.post('/api/chatbot/message', json={'message': 'hello'}, headers=headers)
    second = client.post('/api/chatbot/message', json={'message': 'hello again'}, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 429
