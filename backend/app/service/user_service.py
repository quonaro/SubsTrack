from typing import Optional
from app.repository.user_repository import UserRepository
from app.schema.auth import UserSchema
from app.models.user import User


class UserService:
    """Service for user business logic"""

    def __init__(self):
        self.user_repository = UserRepository()

    async def get_user_by_id(self, user_id: int) -> Optional[UserSchema]:
        """Get user by ID"""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return None
        
        return UserSchema(
            id=user.id,
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language_code=user.language_code,
            is_premium=user.is_premium,
        )

    async def get_user_by_telegram_id(self, telegram_id: int) -> Optional[UserSchema]:
        """Get user by Telegram ID"""
        user = await self.user_repository.get_by_telegram_id(telegram_id)
        if not user:
            return None
        
        return UserSchema(
            id=user.id,
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language_code=user.language_code,
            is_premium=user.is_premium,
        )





