from typing import Optional, Tuple
from app.models.user import User
from tortoise.exceptions import DoesNotExist


class UserRepository:
    """Repository for User model operations"""

    @staticmethod
    async def get_by_telegram_id(telegram_id: int) -> Optional[User]:
        """Get user by Telegram ID"""
        try:
            return await User.get(telegram_id=telegram_id)
        except DoesNotExist:
            return None

    @staticmethod
    async def get_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            return await User.get(id=user_id)
        except DoesNotExist:
            return None

    @staticmethod
    async def create(user_data: dict) -> User:
        """Create new user"""
        return await User.create(**user_data)

    @staticmethod
    async def get_or_create(telegram_id: int, defaults: dict) -> Tuple[User, bool]:
        """Get or create user by Telegram ID"""
        return await User.get_or_create(telegram_id=telegram_id, defaults=defaults)

    @staticmethod
    async def update(user: User, update_data: dict) -> User:
        """Update user data"""
        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)
        await user.save()
        return user

    @staticmethod
    async def delete(user: User) -> bool:
        """Delete user"""
        await user.delete()
        return True

