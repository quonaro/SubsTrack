import os
from tortoise import Tortoise
from config import settings


def get_db_file_path() -> str:
    """Get absolute path to database file"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    project_root = os.path.dirname(backend_dir)
    return os.path.join(project_root, settings.db_path)


async def init_db() -> None:
    """Initialize database connection and create tables if database doesn't exist"""
    # Initialize Tortoise ORM
    await Tortoise.init(config=settings.tortoise_orm_config)

    # SQLite specific logic
    if settings.db_type == "sqlite":
        db_file = get_db_file_path()
        db_exists = os.path.exists(db_file)
        if not db_exists:
            print(f"Database file not found. Creating new database at {db_file}")
            # Create empty database file
            os.makedirs(os.path.dirname(db_file) or ".", exist_ok=True)
            open(db_file, "a").close()

    # Generate schemas using Tortoise ORM (safe=True won't fail if tables exist)
    try:
        await Tortoise.generate_schemas(safe=True)
        if not db_exists:
            print("Database tables created successfully")
    except Exception as e:
        # If schema generation fails, log warning but continue
        print(f"Warning: Could not generate schemas automatically: {e}")
        print(
            "Database connection initialized, but tables may need to be created manually"
        )


async def close_db() -> None:
    """Close database connection"""
    await Tortoise.close_connections()
