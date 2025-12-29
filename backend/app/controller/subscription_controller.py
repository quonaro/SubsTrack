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
    SubscriptionOccurrence
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions for current user"""
    service = SubscriptionService()
    return await service.get_user_subscriptions(current_user.id, is_active)


@router.get("/next-month-total", response_model=NextMonthTotalResponse)
async def get_next_month_total(
    current_user: User = Depends(get_current_user)
):
    """Get total amount for next month"""
    service = SubscriptionService()
    return await service.get_next_month_total(current_user.id)


@router.get("/calendar", response_model=List[SubscriptionOccurrence])
async def get_calendar(
    start_date: datetime = Query(..., description="Start date of range"),
    end_date: datetime = Query(..., description="End date of range"),
    current_user: User = Depends(get_current_user)
):
    """Get subscription occurrences for calendar"""
    service = SubscriptionService()
    return await service.get_calendar_occurrences(current_user.id, start_date, end_date)


@router.post("", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new subscription"""
    service = SubscriptionService()
    return await service.create_subscription(current_user, subscription_data)


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    """Update subscription"""
    service = SubscriptionService()
    subscription = await service.update_subscription(
        subscription_id, 
        current_user.id, 
        subscription_data
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.delete("/{subscription_id}", status_code=204)
async def delete_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete subscription"""
    service = SubscriptionService()
    success = await service.delete_subscription(subscription_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return None


@router.post("/{subscription_id}/archive", response_model=SubscriptionResponse)
async def archive_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user)
):
    """Archive subscription (set is_active=False)"""
    service = SubscriptionService()
    subscription = await service.archive_subscription(subscription_id, current_user.id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


