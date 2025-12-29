from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User
from app.service.statistics_service import StatisticsService
from app.schema.statistics import StatisticsResponse

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get("", response_model=StatisticsResponse)
async def get_statistics(current_user: User = Depends(get_current_user)):
    """Get statistics for current user"""
    service = StatisticsService()
    return await service.get_statistics(current_user.id)
