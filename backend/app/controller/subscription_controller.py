from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from app.core.dependencies import get_current_user
from app.models.user import User
from app.service.subscription_service import SubscriptionService
from app.schema.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    NextMonthTotalResponse,
    SubscriptionOccurrence,
)
from app.schema.history import HistoryResponse


router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: str = Query("date_asc", description="Sort by field"),
    current_user: User = Depends(get_current_user),
):
    """Get all subscriptions for current user"""
    service = SubscriptionService()
    return await service.get_user_subscriptions(current_user.id, is_active, sort_by)


@router.get("/next-month-total", response_model=NextMonthTotalResponse)
async def get_next_month_total(current_user: User = Depends(get_current_user)):
    """Get total amount for next month"""
    service = SubscriptionService()
    return await service.get_next_month_total(current_user.id)


@router.get("/calendar", response_model=List[SubscriptionOccurrence])
async def get_calendar(
    start_date: datetime = Query(..., description="Start date of range"),
    end_date: datetime = Query(..., description="End date of range"),
    current_user: User = Depends(get_current_user),
):
    """Get subscription occurrences for calendar"""
    service = SubscriptionService()
    return await service.get_calendar_occurrences(current_user.id, start_date, end_date)


@router.get("/test-notification")
async def send_test_notification(current_user: User = Depends(get_current_user)):
    """Send a test Telegram notification to the current user"""
    import logging

    logger = logging.getLogger(__name__)

    logger.info(
        f"User {current_user.id} ({current_user.username}) requested a test notification"
    )

    from config import settings

    if settings.dev and not current_user.is_admin:
        logger.warning(
            f"User {current_user.id} is not an admin, skipping notification in DEV mode"
        )
        raise HTTPException(
            status_code=403, detail="Only admins can receive notifications in DEV mode"
        )

    if not current_user.telegram_id:
        logger.warning(f"User {current_user.id} has no Telegram ID linked")
        raise HTTPException(status_code=400, detail="User has no Telegram ID linked")

    from app.service.telegram_service import TelegramService

    service = TelegramService()
    success = await service.send_message(
        current_user.telegram_id,
        "🚀 <b>SubsTrack:</b> Это тестовое уведомление! Ваша настройка уведомлений работает корректно.",
    )

    if not success:
        logger.error(f"Failed to send test notification for user {current_user.id}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send notification. Check bot token and ensure the bot is started by the user.",
        )

    logger.info(f"Test notification successfully sent for user {current_user.id}")
    return {"status": "success", "message": "Test notification sent"}


@router.post("/{subscription_id}/test-notification")
async def send_subscription_test_notification(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Send a test notification for a specific subscription"""
    service = SubscriptionService()
    subscription = await service.get_subscription(subscription_id, current_user.id)

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    from app.service.reminder_service import ReminderService
    from app.models.subscription import Subscription

    # We need the actual model instance, not the response schema
    sub_model = await Subscription.get(id=subscription_id).prefetch_related("user")

    reminder_service = ReminderService()
    success = await reminder_service.send_reminder(sub_model, force=True)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send notification. Check bot token and logs.",
        )

    return {"status": "success", "message": "Notification sent"}


@router.get("/export")
async def export_subscriptions(current_user: User = Depends(get_current_user)):
    """Export subscriptions to CSV"""
    import csv
    import io

    service = SubscriptionService()
    subscriptions = await service.get_user_subscriptions(current_user.id)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(
        [
            "ID",
            "Status",
            "Name",
            "Price",
            "Currency",
            "Period (days)",
            "Next Payment",
            "Category",
        ]
    )

    for sub in subscriptions:
        status = "Active" if sub.is_active else "Inactive"
        category = sub.category.name if sub.category else ""
        writer.writerow(
            [
                sub.id,
                status,
                sub.name,
                sub.price,
                sub.currency,
                sub.period_days,
                sub.next_payment_date,
                category,
            ]
        )

    output.seek(0)

    from config import settings

    if settings.dev and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Only admins can use export in DEV mode"
        )

    if not current_user.telegram_id:
        raise HTTPException(status_code=400, detail="User has no Telegram ID linked")

    from app.service.telegram_service import TelegramService

    telegram_service = TelegramService()
    success = await telegram_service.send_document(
        current_user.telegram_id,
        output.getvalue().encode("utf-8"),
        "subscriptions.csv",
        caption="📊 <b>Ваш экспорт подписок готов!</b>",
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send file via Telegram")

    return {"status": "success", "message": "Export sent to Telegram"}


@router.get("/history", response_model=List[HistoryResponse])
async def get_all_history(current_user: User = Depends(get_current_user)):
    """Get all history (audit + payments) for current user"""
    service = SubscriptionService()
    return await service.get_all_history_merged(current_user.id)


@router.post("", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
):
    """Create new subscription"""
    service = SubscriptionService()
    return await service.create_subscription(current_user, subscription_data)


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Get subscription by ID"""
    service = SubscriptionService()
    subscription = await service.get_subscription(subscription_id, current_user.id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update subscription"""
    service = SubscriptionService()
    subscription = await service.update_subscription(
        subscription_id, current_user.id, subscription_data
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.delete("/{subscription_id}", status_code=204)
async def delete_subscription(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Delete subscription"""
    service = SubscriptionService()
    success = await service.delete_subscription(subscription_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return None


@router.post("/{subscription_id}/archive", response_model=SubscriptionResponse)
async def archive_subscription(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Archive subscription (set is_active=False)"""
    service = SubscriptionService()
    subscription = await service.archive_subscription(subscription_id, current_user.id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.post("/{subscription_id}/paid", response_model=SubscriptionResponse)
async def mark_as_paid(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Mark subscription as paid and record history"""
    service = SubscriptionService()
    subscription = await service.mark_as_paid(subscription_id, current_user.id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.get("/{subscription_id}/history", response_model=List[HistoryResponse])
async def get_subscription_history(
    subscription_id: int, current_user: User = Depends(get_current_user)
):
    """Get full audit history for a specific subscription"""
    service = SubscriptionService()
    return await service.get_subscription_history(subscription_id, current_user.id)
