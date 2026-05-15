import os
from urllib.parse import urlparse
from typing import Any

import asyncpg

_pool: asyncpg.Pool | None = None


def _to_positive_int(value: str | int | None, fallback: int) -> int:
    try:
        parsed = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


def _resolve_pool_limits(database_url: str) -> tuple[int, int]:
    requested_max = _to_positive_int(os.getenv('FASTAPI_DB_POOL_MAX'), 5)
    min_size = min(_to_positive_int(os.getenv('FASTAPI_DB_POOL_MIN'), 1), requested_max)

    parsed = urlparse(database_url)
    host = str(parsed.hostname or '').strip().lower()
    port = parsed.port or 5432
    session_port = _to_positive_int(os.getenv('DB_SUPABASE_SESSION_PORT'), 5432)
    session_cap = _to_positive_int(os.getenv('FASTAPI_DB_SUPABASE_SESSION_POOL_MAX'), 2)
    if host.endswith('.pooler.supabase.com') and port == session_port:
        requested_max = min(requested_max, session_cap)
        min_size = min(min_size, requested_max)

    return max(1, min_size), max(1, requested_max)


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool

    database_url = str(os.getenv('DATABASE_URL', '')).strip()
    if not database_url:
        raise RuntimeError('DATABASE_URL is not configured for AI service.')

    min_size, max_size = _resolve_pool_limits(database_url)
    _pool = await asyncpg.create_pool(database_url, min_size=min_size, max_size=max_size)
    return _pool


async def fetch_open_jobs(limit: int = 120) -> list[dict[str, Any]]:
    pool = await get_pool()

    query = """
        SELECT
            j.id,
            j.title,
            COALESCE(j.description, '') AS description,
            COALESCE(j.location, '') AS location,
            COALESCE(j.type, '') AS type,
            COALESCE(j.skills, ARRAY[]::text[]) AS skills
        FROM jobs j
        WHERE j.status = 'open'
        ORDER BY j.created_at DESC
        LIMIT $1
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, max(1, int(limit)))

    return [dict(row) for row in rows]
