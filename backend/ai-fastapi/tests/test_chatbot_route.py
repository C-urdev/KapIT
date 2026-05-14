from fastapi.testclient import TestClient

from main import app


def test_chatbot_message_route_returns_intent_payload():
    client = TestClient(app)
    response = client.post('/api/chatbot/message', json={'message': 'helo'})

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {'reply', 'intent', 'confidence', 'actions'}
    assert isinstance(payload.get('reply'), str)
    assert payload.get('intent') == 'greeting'
    assert isinstance(payload.get('confidence'), (int, float))
    assert isinstance(payload.get('actions'), list)


def test_chatbot_message_route_rejects_missing_message():
    client = TestClient(app)
    response = client.post('/api/chatbot/message', json={})
    assert response.status_code == 422


def test_chatbot_message_route_rejects_blank_message():
    client = TestClient(app)
    response = client.post('/api/chatbot/message', json={'message': '    '})
    assert response.status_code == 422


def test_chatbot_message_route_rejects_too_long_message():
    client = TestClient(app)
    response = client.post('/api/chatbot/message', json={'message': 'a' * 321})
    assert response.status_code == 422
