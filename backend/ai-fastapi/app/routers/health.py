from fastapi import APIRouter

router = APIRouter()


@router.get('/health')
def health_check():
    return {'success': True, 'service': 'fastapi', 'message': 'AI service is running'}