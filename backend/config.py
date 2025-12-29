from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    app_name: str = "SubsTrack API"
    debug: bool = False
    
    # Database settings for Tortoise ORM (SQLite)
    db_path: str = "db.db"  # Path to SQLite database file (in project root)
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production"
    telegram_bot_token: str = ""  # Telegram bot token for validating initData
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env

    @property
    def tortoise_orm_config(self) -> dict:
        """Generate Tortoise ORM configuration dictionary for SQLite"""
        # Get database file path in project root (one level up from backend directory)
        backend_dir = os.path.dirname(__file__)
        project_root = os.path.dirname(backend_dir)  # Go up one level to project root
        db_file = os.path.join(project_root, self.db_path)
        
        # For Tortoise ORM with SQLite, use simple relative path
        # The format should be: sqlite://path/to/file (no slashes after sqlite://)
        db_file_normalized = os.path.normpath(db_file).replace("\\", "/")
        
        return {
            "connections": {"default": f"sqlite://{db_file_normalized}"},
            "apps": {
                "models": {
                    "models": ["app.models", "aerich.models"],
                    "default_connection": "default",
                },
            },
        }


settings = Settings()


def get_tortoise_config() -> dict:
    """Get Tortoise ORM configuration for Aerich"""
    return settings.tortoise_orm_config


TORTOISE_ORM = settings.tortoise_orm_config

