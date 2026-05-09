from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.scoring import analyze_resume, compute_match

router = APIRouter()


class FeatureStatus(BaseModel):
    feature: str
    status: str
    note: str


class CandidatePayload(BaseModel):
    id: str | None = ''
    name: str | None = ''
    desired_role: str | None = ''
    summary: str | None = ''
    resume_text: str | None = ''
    skills: list[str] = Field(default_factory=list)
    location: str | None = ''
    preferred_type: str | None = ''
    experience_years: int | None = None


class JobPayload(BaseModel):
    id: int | str | None = None
    title: str = ''
    description: str = ''
    location: str = ''
    type: str = ''
    skills: list[str] = Field(default_factory=list)


class MatchJobsRequest(BaseModel):
    candidate: CandidatePayload
    jobs: list[JobPayload] = Field(default_factory=list)


class RankCandidatesRequest(BaseModel):
    job: JobPayload
    candidates: list[CandidatePayload] = Field(default_factory=list)


class AnalyzeResumeRequest(BaseModel):
    candidate: CandidatePayload


@router.get('/features')
def list_features():
    return {
        'success': True,
        'features': [
            FeatureStatus(feature='resume-parsing', status='available', note='Profile and resume heuristics are available').model_dump(),
            FeatureStatus(feature='ats-analysis', status='available', note='ATS-style scoring and improvement hints are available').model_dump(),
            FeatureStatus(feature='job-matching', status='available', note='Candidate-to-job match scoring is available').model_dump(),
            FeatureStatus(feature='candidate-ranking', status='available', note='Employers can rank applicants against a job description').model_dump(),
        ],
    }


@router.post('/analyze-resume')
def analyze_resume_route(payload: AnalyzeResumeRequest):
    analysis = analyze_resume(payload.candidate.model_dump())
    return {
        'success': True,
        'analysis': analysis,
    }


@router.post('/match-jobs')
def match_jobs(payload: MatchJobsRequest):
    candidate = payload.candidate.model_dump()
    matches = []
    for job in payload.jobs:
        job_data = job.model_dump()
        score = compute_match(candidate, job_data)
        matches.append({
            'job_id': job_data.get('id'),
            **score,
        })

    matches.sort(key=lambda item: item['match_percentage'], reverse=True)
    return {
        'success': True,
        'matches': matches,
    }


@router.post('/rank-candidates')
def rank_candidates(payload: RankCandidatesRequest):
    job = payload.job.model_dump()
    rankings = []
    for candidate in payload.candidates:
        candidate_data = candidate.model_dump()
        score = compute_match(candidate_data, job)
        rankings.append({
            'candidate_id': candidate_data.get('id'),
            'candidate_name': candidate_data.get('name') or candidate_data.get('desired_role') or 'Candidate',
            **score,
        })

    rankings.sort(key=lambda item: item['match_percentage'], reverse=True)
    return {
        'success': True,
        'rankings': rankings,
    }
