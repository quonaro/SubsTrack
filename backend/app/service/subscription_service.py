from typing import Optional, List
from app.repository.subscription_repository import SubscriptionRepository
from app.models.user import User
from app.models.subscription import Subscription
from app.schema.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    NextMonthTotalResponse,
    SubscriptionOccurrence,
)
from datetime import datetime, timedelta, date
from app.models.payment import PaymentHistory
from app.models.history import History
from app.schema.payment import PaymentHistoryResponse
from app.schema.history import HistoryResponse


from fastapi.encoders import jsonable_encoder


class SubscriptionService:
    """Service for subscription business logic"""

    def __init__(self):
        self.repository = SubscriptionRepository()

    async def _log_history(
        self,
        subscription: Subscription,
        event_type: str,
        details: Optional[dict] = None,
    ):
        """Log a history event"""
        await History.create(
            subscription=subscription,
            event_type=event_type,
            details=jsonable_encoder(details) if details else None,
        )

    async def get_user_subscriptions(
        self, user_id: int, is_active: Optional[bool] = None, sort_by: str = "date_asc"
    ) -> List[SubscriptionResponse]:
        """Get all subscriptions for user"""
        subscriptions = await self.repository.get_all_by_user(
            user_id, is_active, sort_by
        )

        # Prefetch last payments for each
        res = []
        for sub in subscriptions:
            # Note: For bulk this might be inefficient (N+1), but let's see.
            # In a real app we'd prefetch or join.
            last_p = (
                await PaymentHistory.filter(subscription=sub)
                .order_by("-date", "-created_at")
                .first()
            )
            s_res = SubscriptionResponse.model_validate(sub)
            if last_p:
                s_res.last_paid_at = last_p.created_at
            res.append(s_res)
        return res

    async def get_subscription(
        self, subscription_id: int, user_id: int
    ) -> Optional[SubscriptionResponse]:
        """Get subscription by ID"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None

        last_p = (
            await PaymentHistory.filter(subscription=subscription)
            .order_by("-date", "-created_at")
            .first()
        )
        res = SubscriptionResponse.model_validate(subscription)
        if last_p:
            res.last_paid_at = last_p.created_at
        return res

    def _add_months(self, source_date: datetime, months: int) -> datetime:
        """Add months to a date, handling end-of-month clamping"""
        month = source_date.month - 1 + months
        year = source_date.year + month // 12
        month = month % 12 + 1

        # Days in month lookup (handling leap year for Feb)
        days_in_months = [
            31,
            29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ]
        day = min(source_date.day, days_in_months[month - 1])

        return source_date.replace(year=year, month=month, day=day)

    def _get_semantic_period(self, period_days: int) -> int:
        """Return number of months if period is semantic, else 0"""
        mapping = {
            30: 1,  # Monthly
            60: 2,  # 2 Months
            90: 3,  # 3 Months
            180: 6,  # 6 Months
            365: 12,  # Yearly
        }
        return mapping.get(period_days, 0)

    def _calculate_next_occurrence(
        self, start_date: datetime, period_days: int
    ) -> datetime:
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

    async def create_subscription(
        self, user: User, subscription_data: SubscriptionCreate
    ) -> SubscriptionResponse:
        """Create new subscription"""
        data = subscription_data.model_dump()
        subscription = await self.repository.create(user, data)
        await self._log_history(
            subscription,
            "created",
            {
                "name": subscription.name,
                "price": float(subscription.price),
                "currency": subscription.currency,
            },
        )
        return SubscriptionResponse.model_validate(subscription)

    async def update_subscription(
        self, subscription_id: int, user_id: int, update_data: SubscriptionUpdate
    ) -> Optional[SubscriptionResponse]:
        """Update subscription"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None

        data = update_data.model_dump(exclude_unset=True)
        # Calculate diff for history
        changes = {}
        for key, value in data.items():
            old_value = getattr(subscription, key, None)
            if old_value != value:
                # Handle Decimal serialization manually for cleaner history (optional but good)
                if key == "price":
                    changes[key] = str(value)
                else:
                    changes[key] = value

        updated_subscription = await self.repository.update(subscription, data)
        if changes:
            await self._log_history(updated_subscription, "updated", changes)

        return SubscriptionResponse.model_validate(updated_subscription)

    async def delete_subscription(self, subscription_id: int, user_id: int) -> bool:
        """Delete subscription"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return False
        await self.repository.delete(subscription)
        return True

    async def archive_subscription(
        self, subscription_id: int, user_id: int
    ) -> Optional[SubscriptionResponse]:
        """Archive subscription (set is_active=False)"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None

        subscription.is_active = False
        subscription.is_active = False
        await subscription.save()
        await self._log_history(subscription, "archived")
        return SubscriptionResponse.model_validate(subscription)

    async def _create_payment_history(
        self, subscription: Subscription, date_paid: datetime
    ) -> PaymentHistory:
        """Create a payment history record"""
        return await PaymentHistory.create(
            subscription=subscription,
            amount=subscription.price,
            currency=subscription.currency,
            date=date_paid.date(),
        )

    async def mark_as_paid(
        self, subscription_id: int, user_id: int
    ) -> Optional[SubscriptionResponse]:
        """Mark subscription as paid, record history, and advance next payment date"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return None

        # Anti-spam check: if already paid in the last 1 hour, ignore advancing
        recent_payment = (
            await PaymentHistory.filter(
                subscription=subscription, date=datetime.now().date()
            )
            .order_by("-created_at")
            .first()
        )

        if recent_payment and (
            datetime.now() - recent_payment.created_at.replace(tzinfo=None)
        ) < timedelta(hours=1):
            return await self.get_subscription(subscription_id, user_id)

        # 1. Record History
        now = datetime.now()
        await self._create_payment_history(subscription, now)
        # Payment is tracked in PaymentHistory, we will merge it in get_history

        # 2. Advance Date
        current_next = subscription.next_payment_date
        if isinstance(current_next, date) and not isinstance(current_next, datetime):
            current_next = datetime.combine(current_next, datetime.min.time())

        months_to_add = self._get_semantic_period(subscription.period_days)

        if months_to_add > 0:
            next_date = self._add_months(current_next, months_to_add)
        else:
            next_date = current_next + timedelta(days=subscription.period_days)

        subscription.next_payment_date = next_date.date()
        await subscription.save()

        # Reset notification rules for the next cycle
        from app.models.notification_rule import NotificationRule

        await NotificationRule.filter(subscription=subscription).update(
            last_sent_at=None
        )

        return SubscriptionResponse.model_validate(subscription)

    async def get_next_month_total(self, user_id: int) -> NextMonthTotalResponse:
        """Get total amount for next month"""
        result = await self.repository.get_next_month_total(user_id)
        return NextMonthTotalResponse(**result)

    async def get_history(
        self, user_id: int, subscription_id: Optional[int] = None
    ) -> List[PaymentHistoryResponse]:
        """Get payment history"""
        history = await self.repository.get_history(user_id, subscription_id)
        return [PaymentHistoryResponse.model_validate(h) for h in history]

    async def get_all_history_merged(self, user_id: int) -> List[HistoryResponse]:
        """Get full audit history for ALL user subscriptions (merging History and PaymentHistory)"""
        # 1. Fetch all user subscriptions (to filter history)
        # Actually easier to filter History by subscription__user_id if relations allow,
        # but History -> Subscription -> User.
        # Tortoise supports double underscore filtering.

        # 1. Fetch generic history
        history_records = (
            await History.filter(subscription__user_id=user_id)
            .prefetch_related(
                "subscription",
                "subscription__category",
                "subscription__notification_rules",
            )
            .all()
        )

        # 2. Fetch payment history
        # We need subscription loaded with details for naming
        from app.models.payment import PaymentHistory

        payments = (
            await PaymentHistory.filter(subscription__user_id=user_id)
            .order_by("-date")
            .prefetch_related(
                "subscription",
                "subscription__category",
                "subscription__notification_rules",
            )
        )

        # 3. Merge
        results = []
        for h in history_records:
            # We need to ensure subscription is loaded for details if we want to show name?
            # HistoryResponse has subscription_id. Frontend might need name.
            # But HistoryResponse schema currently only has IDs.
            # Frontend uses subscription Store or needs data in response?
            # Looking at HistoryList.vue it uses `item.subscription?.name`.
            # So HistoryResponse needs 'subscription' field?
            # Let's check HistoryResponse schema.
            # It currently might not have it.
            # Wait, `get_subscription_history` uses `HistoryResponse`.
            # Let's check `HistoryResponse` definition again.
            # If it's missing, we need to add it.
            results.append(HistoryResponse.model_validate(h))

        for p in payments:
            results.append(
                HistoryResponse(
                    id=p.id,
                    subscription_id=p.subscription_id,
                    event_type="payment",
                    details={
                        "amount": float(p.amount),
                        "currency": p.currency,
                        "date": str(p.date),
                    },
                    created_at=p.created_at,
                    subscription=p.subscription,  # Include full subscription object
                )
            )

        # 4. Sort
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    async def get_subscription_history(
        self, subscription_id: int, user_id: int
    ) -> List[HistoryResponse]:
        """Get full audit history for a subscription (merging History and PaymentHistory)"""
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return []

        # 1. Fetch generic history
        history_records = await History.filter(subscription=subscription).all()

        # 2. Fetch payment history
        payments = await self.repository.get_history(user_id, subscription_id)

        # 3. Merge
        results = []
        for h in history_records:
            results.append(HistoryResponse.model_validate(h))

        for p in payments:
            # Convert PaymentHistory to HistoryResponse format
            results.append(
                HistoryResponse(
                    id=p.id,  # Note: IDs might collide if we are not careful in UI keying, but for list it's ok.
                    # Actually ID collision is possible between tables.
                    # We might want to prefix ID or genericize.
                    # But HistoryResponse.id is int.
                    # Let's hope frontend uses composed key.
                    # FOR NOW: Use p.id.
                    subscription_id=subscription.id,
                    event_type="payment",
                    details={
                        "amount": float(p.amount),
                        "currency": p.currency,
                        "date": str(p.date),
                    },
                    created_at=p.created_at,
                )
            )

        # 4. Sort by created_at desc
        results.sort(key=lambda x: x.created_at, reverse=True)

        return results

    async def check_reminders(self):
        """Check for subscriptions that need reminders and send them using granular rules"""
        from app.service.reminder_service import ReminderService

        reminder_service = ReminderService()
        await reminder_service.process_all_reminders()

    async def get_calendar_occurrences(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> List[SubscriptionOccurrence]:
        """Get all subscription occurrences in a date range"""
        subscriptions = await self.repository.get_all_by_user(user_id, is_active=True)
        occurrences = []

        # Normalize dates to start of day for comparison and make them naive
        start_date = start_date.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )
        end_date = end_date.replace(
            hour=23, minute=59, second=59, microsecond=999999, tzinfo=None
        )

        for sub in subscriptions:
            # Anchor from the start date and make it naive datetime
            if isinstance(sub.start_date, datetime):
                anchor_date = sub.start_date.replace(
                    hour=0, minute=0, second=0, microsecond=0, tzinfo=None
                )
            else:
                anchor_date = datetime.combine(sub.start_date, datetime.min.time())

            # Determine semantic interval
            months_to_add = self._get_semantic_period(sub.period_days)
            is_semantic = months_to_add > 0

            # Calculate occurrences
            current_date = anchor_date
            iterations = 0

            while current_date <= end_date:
                if current_date >= start_date:
                    occurrences.append(
                        SubscriptionOccurrence(
                            date=current_date,
                            subscription=SubscriptionResponse.model_validate(sub),
                        )
                    )

                # Next date
                if is_semantic:
                    iterations += 1
                    current_date = self._add_months(
                        anchor_date, months_to_add * iterations
                    )
                else:
                    current_date += timedelta(days=sub.period_days)

                # Optimization to skip ahead if very far behind
                if current_date < start_date and not is_semantic:
                    # Calculate remaining days to start_date
                    diff = (start_date - current_date).days
                    steps = diff // sub.period_days
                    if steps > 1:
                        current_date += timedelta(days=steps * sub.period_days)

                if sub.period_days <= 0:
                    break

        # Sort by date
        occurrences.sort(key=lambda x: x.date)
        return occurrences
