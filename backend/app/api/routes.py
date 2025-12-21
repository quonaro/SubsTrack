from fastapi import APIRouter
from app.api.auth import router as auth_router

router = APIRouter()

# Include auth routes
router.include_router(auth_router)


@router.get("/test")
async def test_endpoint():
    return {"message": "API is working correctly"}

