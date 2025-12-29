"""
Script to initialize database and create tables manually
Run with: uv run python init_db.py
"""
import asyncio
from tortoise import Tortoise
from config import get_tortoise_config


async def init_database():
    """Initialize database and create tables"""
    config = get_tortoise_config()
    await Tortoise.init(config=config)
    
    # Create tables using raw SQL (workaround for compatibility issue)
    
    # Get connection
    conn = Tortoise.get_connection("default")
    
    # Create User table
    await conn.execute_query("""
        CREATE TABLE IF NOT EXISTS "users" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            "telegram_id" INTEGER NOT NULL UNIQUE,
            "username" VARCHAR(255),
            "first_name" VARCHAR(255),
            "last_name" VARCHAR(255),
            "language_code" VARCHAR(10),
            "is_bot" INT NOT NULL DEFAULT 0,
            "is_premium" INT NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index on telegram_id
    await conn.execute_query("""
        CREATE INDEX IF NOT EXISTS "users_telegram_id" ON "users" ("telegram_id")
    """)
    
    # Create Subscription table
    await conn.execute_query("""
        CREATE TABLE IF NOT EXISTS "subscriptions" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" INTEGER NOT NULL,
            "name" VARCHAR(255) NOT NULL,
            "price" DECIMAL(10, 2) NOT NULL,
            "currency" VARCHAR(10) NOT NULL DEFAULT 'RUB',
            "period_days" INTEGER NOT NULL,
            "next_payment_date" TIMESTAMP NOT NULL,
            "icon" VARCHAR(10) NOT NULL DEFAULT '📦',
            "is_active" INT NOT NULL DEFAULT 1,
            "reminder_enabled" INT NOT NULL DEFAULT 1,
            "reminder_days_before" INTEGER NOT NULL DEFAULT 1,
            "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
        )
    """)
    
    # Create indexes on subscriptions
    await conn.execute_query("""
        CREATE INDEX IF NOT EXISTS "subscriptions_user_id_is_active" ON "subscriptions" ("user_id", "is_active")
    """)
    
    print("Database initialized successfully!")
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(init_database())

