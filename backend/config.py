from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    app_name: str = "SubsTrack API"
    debug: bool = False
    
    # Database settings
    db_type: str = "sqlite" # sqlite or postgres
    
    # SQLite
    db_path: str = "db.db"  # Path to SQLite database file (in project root)
    
    # PostgreSQL
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "substrack"
    postgres_host: str = "db"
    postgres_port: int = 5432
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production"
    
    # Telegram settings
    telegram_bot_token: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env

    @property
    def tortoise_orm_config(self) -> dict:
        """Generate Tortoise ORM configuration"""
        
        if self.db_type == "postgres":
            db_url = f"postgres://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        else:
            # SQLite fallback
            backend_dir = os.path.dirname(__file__)
            project_root = os.path.dirname(backend_dir)  # Go up one level to project root
            db_file = os.path.join(project_root, self.db_path)
            db_file_normalized = os.path.normpath(db_file).replace("\\", "/")
            db_url = f"sqlite://{db_file_normalized}"
        
        return {
            "connections": {"default": db_url},
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

