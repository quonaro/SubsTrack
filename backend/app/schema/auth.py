from pydantic import BaseModel
from typing import Optional


class TelegramAuthRequest(BaseModel):
    """Request schema for Telegram authentication"""
    init_data: str


class UserSchema(BaseModel):
    """User data schema"""
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None
    is_premium: bool = False

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response schema for authentication"""
    access_token: str
    token_type: str = "bearer"
    user: UserSchema





