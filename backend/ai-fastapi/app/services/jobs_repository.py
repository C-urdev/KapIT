import os
from typing import Any

import asyncpg

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool

    database_url = str(os.getenv('DATABASE_URL', '')).strip()
    if not database_url:
        raise RuntimeError('DATABASE_URL is not configured for AI service.')

    _pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
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
