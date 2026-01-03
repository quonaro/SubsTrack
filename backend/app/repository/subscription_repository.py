from typing import Optional, List
from app.models.subscription import Subscription
from app.models.payment import PaymentHistory
from app.models.user import User
from datetime import datetime


class SubscriptionRepository:
    """Repository for Subscription model operations"""

    @staticmethod
    async def get_by_id(subscription_id: int, user_id: int) -> Optional[Subscription]:
        """Get subscription by ID for specific user"""
        try:
            return await Subscription.get(
                id=subscription_id, user_id=user_id
            ).prefetch_related("category", "notification_rules")
        except Subscription.DoesNotExist:
            return None

    @staticmethod
    async def get_all_by_user(
        user_id: int, is_active: Optional[bool] = None, sort_by: str = "date_asc"
    ) -> List[Subscription]:
        """Get all subscriptions for user, optionally filtered by active status and sorted"""
        query = Subscription.filter(user_id=user_id).prefetch_related(
            "category", "notification_rules"
        )
        if is_active is not None:
            query = query.filter(is_active=is_active)

        if sort_by == "date_asc":
            query = query.order_by("next_payment_date", "id")
        elif sort_by == "date_desc":
            query = query.order_by("-next_payment_date")
        elif sort_by == "price_asc":
            query = query.order_by("price")
        elif sort_by == "price_desc":
            query = query.order_by("-price")
        elif sort_by == "name_asc":
            query = query.order_by("name")
        else:
            query = query.order_by("next_payment_date")

        return await query

    @staticmethod
    async def create(user: User, subscription_data: dict) -> Subscription:
        """Create new subscription"""
        notification_rules_data = subscription_data.pop("notification_rules", [])
        subscription_data["user_id"] = user.id
        subscription = await Subscription.create(**subscription_data)

        from app.models.notification_rule import NotificationRule

        for rule_data in notification_rules_data:
            await NotificationRule.create(subscription=subscription, **rule_data)

        await subscription.fetch_related("category", "notification_rules")
        return subscription

    @staticmethod
    async def update(subscription: Subscription, update_data: dict) -> Subscription:
        """Update subscription data"""
        notification_rules_data = update_data.pop("notification_rules", None)

        for key, value in update_data.items():
            if value is not None:
                setattr(subscription, key, value)
        await subscription.save()

        if notification_rules_data is not None:
            from app.models.notification_rule import NotificationRule

            # Simple sync: delete old and create new
            await NotificationRule.filter(subscription=subscription).delete()
            for rule_data in notification_rules_data:
                await NotificationRule.create(subscription=subscription, **rule_data)

        await subscription.fetch_related("category", "notification_rules")
        return subscription

    @staticmethod
    async def delete(subscription: Subscription) -> bool:
        """Delete subscription"""
        await subscription.delete()
        return True

    @staticmethod
    async def get_next_month_total(user_id: int) -> dict:
        """Calculate total amount for next 30 days for active subscriptions"""
        from datetime import timedelta
        from decimal import Decimal

        now = datetime.now()
        # Start from the beginning of today
        today_start = datetime(now.year, now.month, now.day)
        # End in 30 days
        thirty_days_later = today_start + timedelta(days=30)

        subscriptions = await Subscription.filter(
            user_id=user_id,
            is_active=True,
            next_payment_date__gte=today_start,
            next_payment_date__lte=thirty_days_later,
        )

        total = Decimal("0")
        currency = "RUB"
        for sub in subscriptions:
            if sub.currency == currency:
                total += Decimal(str(sub.price))

        return {
            "total": float(total),
            "currency": currency,
            "count": len(subscriptions),
        }

    @staticmethod
    async def get_subscriptions_for_reminder(
        days_before: int = 1,
    ) -> List[Subscription]:
        """Get subscriptions that need reminders sent"""
        from datetime import timedelta

        target_date = datetime.now() + timedelta(days=days_before)
        target_date_start = datetime(
            target_date.year, target_date.month, target_date.day
        )
        target_date_end = target_date_start + timedelta(days=1)

        return await Subscription.filter(
            is_active=True,
            reminder_enabled=True,
            reminder_days_before=days_before,
            next_payment_date__gte=target_date_start,
            next_payment_date__lt=target_date_end,
        ).prefetch_related("user")

    @staticmethod
    async def get_history(
        user_id: int, subscription_id: Optional[int] = None
    ) -> List[PaymentHistory]:
        """Get payment history for user, optionally filtered by subscription"""
        query = PaymentHistory.filter(subscription__user_id=user_id)
        if subscription_id:
            query = query.filter(subscription_id=subscription_id)
        return await query.order_by("-date").prefetch_related("subscription")
