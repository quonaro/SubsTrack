from fastapi import APIRouter
from app.controller.auth_controller import router as auth_router
from app.controller.subscription_controller import router as subscription_router
from app.controller.statistics_controller import router as statistics_router

router = APIRouter()

# Include auth routes
router.include_router(auth_router)

# Include subscription routes
router.include_router(subscription_router)

# Include statistics routes
router.include_router(statistics_router)


@router.get("/test")
async def test_endpoint():
    return {"message": "API is working correctly"}




