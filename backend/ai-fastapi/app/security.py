import hashlib
import hmac
import logging
import os
import time
from dataclasses import dataclass
from threading import Lock

from fastapi import Request
from fastapi.responses import JSONResponse


HEADER_NAME = 'x-internal-service-token'
AUTHORIZATION_HEADER_NAME = 'authorization'
WINDOW_SECONDS = 60


@dataclass
class BucketState:
    count: int
    reset_at: float


class InMemoryRouteLimiter:
    def __init__(self) -> None:
        self._lock = Lock()
        self._buckets: dict[str, BucketState] = {}
        self._max_buckets = 10000

    def _prune(self, now: float) -> None:
        expired_keys = [key for key, value in self._buckets.items() if value.reset_at <= now]
        for key in expired_keys:
            self._buckets.pop(key, None)

    def hit(self, bucket_key: str, limit: int) -> tuple[bool, int, int]:
        now = time.time()
        with self._lock:
            if len(self._buckets) >= self._max_buckets:
                self._prune(now)
            if len(self._buckets) >= self._max_buckets:
                oldest_key = next(iter(self._buckets), None)
                if oldest_key:
                    self._buckets.pop(oldest_key, None)

            state = self._buckets.get(bucket_key)
            if state is None or state.reset_at <= now:
                state = BucketState(count=1, reset_at=now + WINDOW_SECONDS)
                self._buckets[bucket_key] = state
            else:
                state.count += 1
                self._buckets[bucket_key] = state

            remaining = max(0, limit - state.count)
            retry_after = max(1, int(state.reset_at - now))
            allowed = state.count <= limit
            return allowed, remaining, retry_after


limiter = InMemoryRouteLimiter()


def _get_internal_token() -> str:
    return str(
        os.getenv('FASTAPI_INTERNAL_SERVICE_TOKEN')
        or os.getenv('INTERNAL_SERVICE_TOKEN')
        or ''
    ).strip()


def _is_production() -> bool:
    env = str(os.getenv('NODE_ENV') or os.getenv('FASTAPI_ENV') or '').strip().lower()
    return env == 'production'


def validate_internal_security_configuration() -> None:
    if _get_internal_token():
        return

    message = 'FASTAPI internal auth token is missing. Set FASTAPI_INTERNAL_SERVICE_TOKEN.'
    if _is_production():
        raise RuntimeError(message)

    logging.getLogger('uvicorn.error').warning('%s Protected AI routes will return 503 until configured.', message)


def _get_route_limits() -> dict[str, int]:
    return {
        '/ai/analyze-resume': max(1, int(os.getenv('FASTAPI_RATE_LIMIT_ANALYZE_RESUME_PER_MIN', '120'))),
        '/ai/match-jobs': max(1, int(os.getenv('FASTAPI_RATE_LIMIT_AI_MATCH_JOBS_PER_MIN', '180'))),
        '/ai/rank-candidates': max(1, int(os.getenv('FASTAPI_RATE_LIMIT_RANK_CANDIDATES_PER_MIN', '120'))),
        '/match-jobs': max(1, int(os.getenv('FASTAPI_RATE_LIMIT_MATCH_JOBS_PER_MIN', '180'))),
        '/api/chatbot/message': max(1, int(os.getenv('FASTAPI_RATE_LIMIT_CHATBOT_PER_MIN', '240'))),
    }


def _get_client_ip(request: Request) -> str:
    forwarded_for = str(request.headers.get('x-forwarded-for') or '').split(',')[0].strip()
    if forwarded_for:
        return forwarded_for

    if request.client and request.client.host:
        return request.client.host

    return 'unknown'


def _build_bucket_key(request: Request) -> str:
    path = request.url.path
    token = str(request.headers.get(HEADER_NAME) or '').strip()
    token_fingerprint = (
        hashlib.sha256(token.encode('utf-8')).hexdigest()[:12]
        if token
        else 'missing'
    )
    client_ip = _get_client_ip(request)
    return f'{path}:{client_ip}:{token_fingerprint}'


def _extract_provided_token(request: Request) -> str:
    explicit_header_token = str(request.headers.get(HEADER_NAME) or '').strip()
    if explicit_header_token:
        return explicit_header_token

    authorization = str(request.headers.get(AUTHORIZATION_HEADER_NAME) or '').strip()
    if authorization.lower().startswith('bearer '):
        return authorization[7:].strip()

    return ''


async def enforce_internal_security(request: Request, call_next):
    path = request.url.path
    route_limits = _get_route_limits()
    route_limit = route_limits.get(path)
    if route_limit is None:
        return await call_next(request)

    expected_token = _get_internal_token()
    provided_token = _extract_provided_token(request)

    if not expected_token:
        return JSONResponse(
            status_code=503,
            content={
                'detail': 'AI service is not configured for internal authentication.',
            },
        )

    if not provided_token or not hmac.compare_digest(provided_token, expected_token):
        return JSONResponse(
            status_code=401,
            content={
                'detail': 'Unauthorized AI service request.',
            },
        )

    bucket_key = _build_bucket_key(request)
    allowed, remaining, retry_after = limiter.hit(bucket_key=bucket_key, limit=route_limit)
    if not allowed:
        response = JSONResponse(
            status_code=429,
            content={
                'detail': 'AI rate limit exceeded.',
            },
        )
        response.headers['Retry-After'] = str(retry_after)
        response.headers['X-RateLimit-Limit'] = str(route_limit)
        response.headers['X-RateLimit-Remaining'] = str(remaining)
        return response

    response = await call_next(request)
    response.headers['X-RateLimit-Limit'] = str(route_limit)
    response.headers['X-RateLimit-Remaining'] = str(remaining)
    return response
