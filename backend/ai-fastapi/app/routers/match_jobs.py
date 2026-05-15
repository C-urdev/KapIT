from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.job_matcher import build_job_matches
from app.services.jobs_repository import fetch_open_jobs

router = APIRouter()


class MatchJobsRequest(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=50)
    experience: str = 'junior'
    candidate: dict | None = None


@router.post('/match-jobs')
async def match_jobs(payload: MatchJobsRequest):
    try:
        jobs = await fetch_open_jobs(limit=120)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail='Unable to fetch jobs for matching.') from error

    return build_job_matches(
        payload.skills,
        payload.experience,
        jobs,
        candidate_profile=payload.candidate,
    )
