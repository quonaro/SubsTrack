from typing import Optional
from app.repository.user_repository import UserRepository
from app.core.security import create_access_token
from app.core.telegram import validate_telegram_init_data
from app.schema.auth import AuthResponse, UserSchema


class AuthService:
    """Service for authentication business logic"""

    def __init__(self):
        self.user_repository = UserRepository()

    async def authenticate_telegram(self, init_data: str) -> Optional[AuthResponse]:
        """
        Authenticate user via Telegram WebApp initData
        
        Args:
            init_data: Telegram WebApp initData string
            
        Returns:
            AuthResponse with token and user data, or None if validation fails
        """
        # Validate Telegram initData
        user_data = validate_telegram_init_data(init_data)
        
        if not user_data:
            return None
        
        telegram_id = user_data.get('id')
        if not telegram_id:
            return None
        
        # Get or create user
        user, created = await self.user_repository.get_or_create(
            telegram_id=telegram_id,
            defaults={
                'username': user_data.get('username'),
                'first_name': user_data.get('first_name'),
                'last_name': user_data.get('last_name'),
                'language_code': user_data.get('language_code'),
                'is_bot': user_data.get('is_bot', False),
                'is_premium': user_data.get('is_premium', False),
            }
        )
        
        # Update user data if not newly created
        if not created:
            update_data = {}
            if user_data.get('username') is not None:
                update_data['username'] = user_data.get('username')
            if user_data.get('first_name') is not None:
                update_data['first_name'] = user_data.get('first_name')
            if user_data.get('last_name') is not None:
                update_data['last_name'] = user_data.get('last_name')
            if user_data.get('language_code') is not None:
                update_data['language_code'] = user_data.get('language_code')
            if 'is_premium' in user_data:
                update_data['is_premium'] = user_data.get('is_premium', False)
            
            if update_data:
                user = await self.user_repository.update(user, update_data)
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": str(user.id), "telegram_id": str(user.telegram_id)}
        )
        
        # Convert user model to schema
        user_schema = UserSchema(
            id=user.id,
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language_code=user.language_code,
            is_premium=user.is_premium,
        )
        
        return AuthResponse(
            access_token=access_token,
            user=user_schema
        )





