from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.models.user import User
from app.core.security import create_access_token, verify_token
from app.core.telegram import validate_telegram_init_data

router = APIRouter(prefix="/auth", tags=["auth"])


class TelegramAuthRequest(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/telegram", response_model=AuthResponse)
async def auth_telegram(request: TelegramAuthRequest):
    """
    Authenticate user via Telegram WebApp initData
    Creates user if doesn't exist, returns JWT token
    """
    # Validate Telegram initData
    user_data = validate_telegram_init_data(request.init_data)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")
    
    telegram_id = user_data.get('id')
    if not telegram_id:
        raise HTTPException(status_code=400, detail="Missing user ID in initData")
    
    # Get or create user
    user, created = await User.get_or_create(
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
        user.username = user_data.get('username') or user.username
        user.first_name = user_data.get('first_name') or user.first_name
        user.last_name = user_data.get('last_name') or user.last_name
        user.language_code = user_data.get('language_code') or user.language_code
        user.is_premium = user_data.get('is_premium', False)
        await user.save()
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id), "telegram_id": str(user.telegram_id)})
    
    return AuthResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "language_code": user.language_code,
            "is_premium": user.is_premium,
        }
    )


@router.get("/me")
async def get_current_user(token: str = Depends(lambda: None)):
    """
    Get current authenticated user
    """
    # This is a simplified version, in production use proper dependency injection
    # For now, token should be passed in Authorization header
    raise HTTPException(status_code=501, detail="Not implemented yet")


def get_current_user_dependency():
    """Dependency to get current user from JWT token"""
    # This will be implemented with proper FastAPI dependency injection
    pass

