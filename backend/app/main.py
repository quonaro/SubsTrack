from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controller.routes import router
from app.core.database import init_db, close_db


import asyncio
import logging
from app.service.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)


async def reminder_task():
    """Background task to check for reminders every hour"""
    # Wait a bit after startup
    await asyncio.sleep(10)
    while True:
        try:
            logger.info("Checking for subscription reminders...")
            service = SubscriptionService()
            await service.check_reminders()
        except Exception as e:
            logger.error(f"Error in reminder background task: {e}")

        # Check every hour (3600 seconds)
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await init_db()
    # Start background task
    bg_task = asyncio.create_task(reminder_task())
    yield
    # Shutdown
    bg_task.cancel()
    await close_db()


app = FastAPI(
    title="SubsTrack API",
    description="Subscription tracking API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],  # Vue dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "SubsTrack API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    from config import settings

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.dev,
        reload_dirs=["app"],
    )
