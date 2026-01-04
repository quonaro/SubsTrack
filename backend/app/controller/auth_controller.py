from fastapi import APIRouter, HTTPException, Depends
from app.schema.auth import TelegramAuthRequest, AuthResponse, UserSchema, UserUpdate
from app.service.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthResponse)
async def auth_telegram(request: TelegramAuthRequest):
    """
    Authenticate user via Telegram WebApp initData
    Creates user if doesn't exist, returns JWT token
    """
    auth_service = AuthService()
    auth_response = await auth_service.authenticate_telegram(request.init_data)

    if not auth_response:
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")

    return auth_response


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user
    """
    return UserSchema(
        id=current_user.id,
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        language_code=current_user.language_code,
        is_premium=current_user.is_premium,
        photo_url=current_user.photo_url,
        timezone=current_user.timezone,
    )


@router.patch("/me", response_model=UserSchema)
async def update_current_user(
    update_data: UserUpdate, current_user: User = Depends(get_current_user)
):
    """
    Update current user profile
    """
    auth_service = AuthService()
    user = await auth_service.update_user(current_user.id, update_data.model_dump())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/dev/login", response_model=AuthResponse)
async def dev_login():
    """
    Development-only endpoint to create test user (ID 1) and get token.
    Strictly restricted to debug/dev environments.
    """
    from config import settings

    # Use settings.dev which defaults to False but can be set via env var DEV
    debug_enabled = settings.dev

    if not debug_enabled:
        raise HTTPException(
            status_code=403,
            detail="Development endpoint is disabled. Set DEV=true in .env to enable.",
        )

    from app.repository.user_repository import UserRepository
    from app.core.security import create_access_token
    from app.models.user import User

    user_repo = UserRepository()

    # Try to find user with ID 1
    user = await user_repo.get_by_id(1)

    if not user:
        # Create user with ID 1
        test_telegram_id = 123456789  # Default test Telegram ID
        user = await User.create(
            id=1,
            telegram_id=test_telegram_id,
            username="admin",
            first_name="Dev",
            last_name="Admin",
            language_code="en",
            is_bot=False,
            is_premium=True,
            photo_url="https://avatars.githubusercontent.com/u/1?v=4",
        )
        print("[DEV LOGIN] Created new dev user with ID 1")
    else:
        print("[DEV LOGIN] Authenticated existing dev user with ID 1")

    # Create JWT token
    access_token = create_access_token(
        data={"sub": str(user.id), "telegram_id": str(user.telegram_id)}
    )

    user_schema = UserSchema(
        id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        language_code=user.language_code,
        is_premium=user.is_premium,
        photo_url=user.photo_url,
    )

    return AuthResponse(access_token=access_token, user=user_schema)
