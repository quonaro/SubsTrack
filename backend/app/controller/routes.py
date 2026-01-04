from fastapi import APIRouter
from app.controller.auth_controller import router as auth_router
from app.controller.subscription_controller import router as subscription_router
from app.controller.statistics_controller import router as statistics_router
from app.api.endpoints.categories import router as category_router
from app.controller.telegram_controller import router as telegram_router

router = APIRouter()

# Include auth routes
router.include_router(auth_router)

# Include subscription routes
router.include_router(subscription_router)

# Include statistics routes
router.include_router(statistics_router)

# Include category routes
router.include_router(category_router, prefix="/categories", tags=["categories"])

# Include telegram routes
router.include_router(telegram_router)


@router.get("/test")
async def test_endpoint():
    return {"message": "API is working correctly"}
