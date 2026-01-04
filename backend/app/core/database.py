from tortoise import Tortoise
from config import settings


import asyncio


async def init_db() -> None:
    """Initialize database connection and create tables if database doesn't exist"""
    max_retries = 5
    retry_delay = 2  # seconds

    for attempt in range(1, max_retries + 1):
        try:
            # Initialize Tortoise ORM
            await Tortoise.init(config=settings.tortoise_orm_config)

            # Generate schemas using Tortoise ORM (safe=True won't fail if tables exist)
            await Tortoise.generate_schemas(safe=True)
            print("Database connection initialized and schemas generated successfully")
            return
        except Exception as e:
            if attempt < max_retries:
                print(
                    f"Attempt {attempt}/{max_retries} failed to initialize database: {e}. "
                    f"Retrying in {retry_delay} seconds..."
                )
                await asyncio.sleep(retry_delay)
            else:
                print(
                    f"Error: Could not initialize database after {max_retries} attempts: {e}"
                )
                print(
                    "Database connection failed, and name resolution might still be failing."
                )
                # Re-raise the exception on the last attempt if it's critical
                raise e


async def close_db() -> None:
    """Close database connection"""
    await Tortoise.close_connections()
