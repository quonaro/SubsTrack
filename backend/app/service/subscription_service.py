from typing import Optional, List
from app.repository.subscription_repository import SubscriptionRepository
from app.models.user import User
from app.models.subscription import Subscription
from app.schema.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, NextMonthTotalResponse, SubscriptionOccurrence
from datetime import datetime, timedelta, date


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

    def _add_months(self, source_date: datetime, months: int) -> datetime:
        """Add months to a date, handling end-of-month clamping"""
        month = source_date.month - 1 + months
        year = source_date.year + month // 12
        month = month % 12 + 1
        
        # Days in month lookup (handling leap year for Feb)
        days_in_months = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        day = min(source_date.day, days_in_months[month-1])
        
        return source_date.replace(year=year, month=month, day=day)

    def _get_semantic_period(self, period_days: int) -> int:
        """Return number of months if period is semantic, else 0"""
        mapping = {
            30: 1,    # Monthly
            60: 2,    # 2 Months
            90: 3,    # 3 Months
            180: 6,   # 6 Months
            365: 12   # Yearly
        }
        return mapping.get(period_days, 0)

    def _calculate_next_occurrence(self, start_date: datetime, period_days: int) -> datetime:
        """Calculate next valid occurrence >= today"""
        today = datetime.now().date()
        current = start_date
        
        # Ensure we work with datetime for arithmetic
        if isinstance(current, date) and not isinstance(current, datetime):
            current = datetime.combine(current, datetime.min.time())
            
        if current.date() >= today:
            return current
            
        if period_days <= 0:
            return current

        months_to_add = self._get_semantic_period(period_days)

        if months_to_add > 0:
            # Semantic calculation (Monthly/Yearly)
            # We iterate from start_date to avoid drift
            iteration = 1
            while True:
                 next_date = self._add_months(current, months_to_add * iteration)
                 if next_date.date() >= today:
                     return next_date
                 iteration += 1
                 # Safety break (approx 100 years)
                 if iteration > 1200: 
                     return next_date
        else:
            # Simple day-based calculation
            diff = (today - current.date()).days
            cycles = diff // period_days
            
            # Jump ahead
            current = current + timedelta(days=cycles * period_days)
            
            # Ensure it's >= today
            while current.date() < today:
                current += timedelta(days=period_days)
            
        return current

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
            if isinstance(sub.start_date, datetime):
                anchor_date = sub.start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
            else:
                anchor_date = datetime.combine(sub.start_date, datetime.min.time())
            
            # Determine semantic interval
            months_to_add = self._get_semantic_period(sub.period_days)
            is_semantic = months_to_add > 0
            
            # Calculate occurrences
            current_date = anchor_date
            
            # Safety break
            iteration_limit = 1000 
            iterations = 0
            
            while current_date <= end_date:
                if current_date >= start_date:
                     occurrences.append(SubscriptionOccurrence(
                        date=current_date,
                        subscription=SubscriptionResponse.model_validate(sub)
                    ))
                
                # Next date
                if is_semantic:
                    iterations += 1
                    current_date = self._add_months(anchor_date, months_to_add * iterations)
                else:
                    current_date += timedelta(days=sub.period_days)
                
                # Optimization to skip ahead if very far behind
                if current_date < start_date and not is_semantic:
                     # Calculate remaining days to start_date
                     diff = (start_date - current_date).days
                     steps = diff // sub.period_days
                     if steps > 1:
                         current_date += timedelta(days=steps * sub.period_days)

                if sub.period_days <= 0: break
                
        # Sort by date
        occurrences.sort(key=lambda x: x.date)
        return occurrences


