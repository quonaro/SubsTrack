from tortoise import Tortoise
from config import settings


async def init_db() -> None:
    """Initialize database connection and create tables if database doesn't exist"""
    # Initialize Tortoise ORM
    await Tortoise.init(config=settings.tortoise_orm_config)

    # Generate schemas using Tortoise ORM (safe=True won't fail if tables exist)
    try:
        await Tortoise.generate_schemas(safe=True)
    except Exception as e:
        # If schema generation fails, log warning but continue
        print(f"Warning: Could not generate schemas automatically: {e}")
        print(
            "Database connection initialized, but tables may need to be created manually"
        )


async def close_db() -> None:
    """Close database connection"""
    await Tortoise.close_connections()
