from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class FeatureStatus(BaseModel):
    feature: str
    status: str
    note: str


@router.get('/features')
def list_features():
    return {
        'success': True,
        'features': [
            FeatureStatus(feature='chatbot', status='planned', note='Future LLM assistant entrypoint').model_dump(),
            FeatureStatus(feature='resume-parsing', status='planned', note='File parsing pipeline placeholder').model_dump(),
            FeatureStatus(feature='job-matching', status='planned', note='Semantic ranking and recommendation placeholder').model_dump(),
        ],
    }