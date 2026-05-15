import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chatbot, health, features, match_jobs
from app.security import enforce_internal_security


def _resolve_allowed_origins() -> list[str]:
    configured = str(os.getenv('FRONTEND_ORIGINS') or '').strip()
    if configured:
        return [origin.strip() for origin in configured.split(',') if origin.strip()]

    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
    ]

app = FastAPI(title='KapIT AI Service', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_allowed_origins(),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.middleware('http')(enforce_internal_security)

app.include_router(health.router)
app.include_router(features.router, prefix='/ai', tags=['ai'])
app.include_router(match_jobs.router, tags=['matching'])
app.include_router(chatbot.router)
