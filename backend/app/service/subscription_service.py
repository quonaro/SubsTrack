from typing import Optional, List
from app.repository.subscription_repository import SubscriptionRepository
from app.models.user import User
from app.models.subscription import Subscription
from app.schema.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, NextMonthTotalResponse, SubscriptionOccurrence
from datetime import datetime, timedelta


class SubscriptionService:
    """Service for subscription business logic"""

    def __init__(self):
        self.repository = SubscriptionRepository()

    async def get_user_subscriptions(self, user_id: int, is_active: Optional[bool] = None, sort_by: str = 'date_asc') -> List[SubscriptionResponse]:
        """Get all subscriptions for user"""
        subscriptions = await self.repository.get_all_by_user(user_id, is_active, sort_by)
        return [SubscriptionResponse.model_validate(sub) for sub in subscriptions]

    async def get_subscription(self, subscription_id: int, user_id: int) -> Optional[SubscriptionResponse]:
        """Get subscription by ID"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None
        return SubscriptionResponse.model_validate(subscription)

    async def create_subscription(self, user: User, subscription_data: SubscriptionCreate) -> SubscriptionResponse:
        """Create new subscription"""
        data = subscription_data.model_dump()
        subscription = await self.repository.create(user, data)
        return SubscriptionResponse.model_validate(subscription)

    async def update_subscription(
        self, 
        subscription_id: int, 
        user_id: int, 
        update_data: SubscriptionUpdate
    ) -> Optional[SubscriptionResponse]:
        """Update subscription"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        data = update_data.model_dump(exclude_unset=True)
        updated_subscription = await self.repository.update(subscription, data)
        return SubscriptionResponse.model_validate(updated_subscription)

    async def delete_subscription(self, subscription_id: int, user_id: int) -> bool:
        """Delete subscription"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return False
        await self.repository.delete(subscription)
        return True

    async def archive_subscription(self, subscription_id: int, user_id: int) -> Optional[SubscriptionResponse]:
        """Archive subscription (set is_active=False)"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        subscription.is_active = False
        await subscription.save()
        return SubscriptionResponse.model_validate(subscription)

    async def get_next_month_total(self, user_id: int) -> NextMonthTotalResponse:
        """Get total amount for next month"""
        result = await self.repository.get_next_month_total(user_id)
        return NextMonthTotalResponse(**result)

    async def get_calendar_occurrences(
        self, 
        user_id: int, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[SubscriptionOccurrence]:
        """Get all subscription occurrences in a date range"""
        subscriptions = await self.repository.get_all_by_user(user_id, is_active=True)
        occurrences = []
        
        # Normalize dates to start of day for comparison and make them naive
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=None)
        
        for sub in subscriptions:
            # Anchor from the start date and make it naive datetime
            # Convert date to datetime at midnight
            if isinstance(sub.start_date, datetime):
                anchor_date = sub.start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
            else:
                # It is a date object
                anchor_date = datetime.combine(sub.start_date, datetime.min.time())
            
            period = timedelta(days=sub.period_days)
            
            # Go forward from anchor_date to find all occurrences within range
            current_date = anchor_date
            while current_date <= end_date:
                if current_date >= start_date:
                    occurrences.append(SubscriptionOccurrence(
                        date=current_date,
                        subscription=SubscriptionResponse.model_validate(sub)
                    ))
                current_date += period
                if sub.period_days <= 0: break # Safety check
                
        # Sort by date
        occurrences.sort(key=lambda x: x.date)
        return occurrences


