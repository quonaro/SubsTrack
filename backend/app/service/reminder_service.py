from app.repository.subscription_repository import SubscriptionRepository
from app.models.subscription import Subscription
from app.models.notification_rule import NotificationRuleType
from config import settings
import asyncio
from datetime import datetime, timedelta, time
import httpx

import logging

logger = logging.getLogger(__name__)


class ReminderService:
    """Service for sending subscription reminders via Telegram bot using granular rules"""

    def __init__(self):
        self.repository = SubscriptionRepository()
        self.bot_token = settings.telegram_bot_token
        self.api_url = "https://api.telegram.org/bot"

    async def send_reminder(
        self,
        subscription: Subscription,
        rule_type: str = "reminder",
        force: bool = False,
    ) -> bool:
        """
        Send reminder message to user via Telegram bot
        """
        if not self.bot_token:
            return False

        if not force and settings.dev and not subscription.user.is_admin:
            return False

        try:
            if not subscription.user.telegram_id:
                return False

            now = datetime.now()
            days_until = (subscription.next_payment_date - now.date()).days

            # Format message
            header = "🔔 Уведомление о подписке"
            if rule_type == NotificationRuleType.RECURRING_REMINDER:
                header = "⚠️ ПОВТОРНОЕ НАПОМИНАНИЕ"

            message = (
                f"{header}\n\n"
                f"{subscription.icon} {subscription.name}\n"
                f"💰 {subscription.price} {subscription.currency}\n"
            )

            if days_until == 0:
                message += "📅 Платеж сегодня!"
            elif days_until > 0:
                message += f"📅 Платеж через {days_until} {'день' if days_until == 1 else 'дня' if days_until < 5 else 'дней'}\n"
                message += f"📆 Дата платежа: {subscription.next_payment_date.strftime('%d.%m.%Y')}"
            else:
                message += f"❌ Платеж просрочен на {abs(days_until)} {'день' if abs(days_until) == 1 else 'дня' if abs(days_until) < 5 else 'дней'}!"

            # Prepare WebApp button
            # Derive frontend URL from backend_url
            backend_url = settings.backend_url
            if backend_url.startswith("/"):
                backend_url = f"http://127.0.0.1:8000{backend_url}"

            # Remove /api suffix if present to get frontend root
            frontend_url = backend_url.removesuffix("/api").removesuffix("/")

            webapp_url = f"{frontend_url}/tg/pay/{subscription.id}"

            reply_markup = {
                "inline_keyboard": [
                    [{"text": "✅ Оплачено", "web_app": {"url": webapp_url}}]
                ]
            }

            # Send message via Telegram Bot API
            url = f"{self.api_url}{self.bot_token}/sendMessage"
            import json

            payload = {
                "chat_id": subscription.user.telegram_id,
                "text": message,
                "reply_markup": json.dumps(reply_markup),
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                return response.status_code == 200

        except Exception as e:
            print(f"Error sending reminder: {e}")
            return False

    def _make_aware(self, dt: datetime) -> datetime:
        """Ensure datetime is timezone aware (UTC)"""
        import pytz

        if dt.tzinfo is None:
            return pytz.UTC.localize(dt)
        return dt

    async def process_all_reminders(self) -> int:
        """
        Evaluate all active notification rules and send triggers
        """
        import pytz

        # Fetch all active subscriptions with rules
        subscriptions = await Subscription.filter(
            is_active=True, reminder_enabled=True
        ).prefetch_related("user", "notification_rules")

        sent_count = 0
        server_now = datetime.now(pytz.UTC)

        for sub in subscriptions:
            # Determine user timezone
            user_tz = pytz.UTC
            if sub.user.timezone:
                try:
                    user_tz = pytz.timezone(sub.user.timezone)
                except pytz.UnknownTimeZoneError:
                    pass

            # Localize server time to user's timezone
            # server_now is already aware, so astimezone works fine
            user_now = server_now.astimezone(user_tz)
            today = user_now.date()
            current_time = user_now.time()

            for rule in sub.notification_rules:
                should_trigger = False

                # Check if already sent recently to avoid spam (within same hour at least)
                # We use server time for last_sent_at check as it is stored in UTC (or naive assumed UTC)
                if rule.last_sent_at:
                    last_sent = self._make_aware(rule.last_sent_at)

                    if (server_now - last_sent) < timedelta(minutes=50):
                        continue

                if rule.rule_type == NotificationRuleType.ADVANCE_NOTICE:
                    target_date = sub.next_payment_date - timedelta(
                        days=rule.days_before or 0
                    )
                    if today == target_date:
                        # If at_time is set, check it. If not, trigger once a day (any time)
                        if rule.at_time:
                            if self._is_time_to_send(rule.at_time, current_time):
                                should_trigger = True
                        else:
                            # If no time, send once a day (if not sent today)
                            if not rule.last_sent_at:
                                should_trigger = True
                            else:
                                last_sent = self._make_aware(rule.last_sent_at)
                                last_sent_local = last_sent.astimezone(user_tz)
                                if last_sent_local.date() < today:
                                    should_trigger = True

                elif rule.rule_type == NotificationRuleType.RECURRING_REMINDER:
                    # Trigger every X hours if next_payment_date is today or in the past
                    if sub.next_payment_date <= today:
                        interval = rule.interval_hours or 1
                        if not rule.last_sent_at:
                            should_trigger = True
                        else:
                            last_sent = self._make_aware(rule.last_sent_at)
                            # Compare using server time (UTC)
                            if (server_now - last_sent) >= timedelta(hours=interval):
                                should_trigger = True

                elif rule.rule_type == NotificationRuleType.PAYMENT_DAY_ALERT:
                    if today == sub.next_payment_date:
                        # Check if already sent today in user's timezone
                        already_sent_today = False
                        if rule.last_sent_at:
                            last_sent = self._make_aware(rule.last_sent_at)
                            last_sent_local = last_sent.astimezone(user_tz)
                            if last_sent_local.date() == today:
                                already_sent_today = True

                        if not already_sent_today:
                            at_time = rule.at_time or time(9, 0)  # Default 9 AM
                            if self._is_time_to_send(at_time, current_time):
                                should_trigger = True

                elif rule.rule_type == NotificationRuleType.SINGLE_REMINDER:
                    if today == sub.next_payment_date:
                        # Check if already sent today in user's timezone
                        already_sent_today = False
                        if rule.last_sent_at:
                            last_sent = self._make_aware(rule.last_sent_at)
                            last_sent_local = last_sent.astimezone(user_tz)
                            if last_sent_local.date() == today:
                                already_sent_today = True

                        if not already_sent_today:
                            if rule.at_time and self._is_time_to_send(
                                rule.at_time, current_time
                            ):
                                should_trigger = True

                if should_trigger:
                    try:
                        logger.info(
                            f"Triggering reminder for sub {sub.id}, rule {rule.rule_type}"
                        )
                        success = await self.send_reminder(sub, rule.rule_type)
                        if success:
                            rule.last_sent_at = server_now.replace(
                                tzinfo=None
                            )  # Store as naive UTC if DB expects naive
                            await rule.save()
                            sent_count += 1
                        else:
                            logger.error(f"Failed to send reminder for sub {sub.id}")
                    except Exception as e:
                        logger.error(
                            f"Exception sending reminder for sub {sub.id}: {e}"
                        )

                # Yield control to event loop
                await asyncio.sleep(0.01)

        return sent_count

    def _is_time_to_send(self, scheduled: time, current: time) -> bool:
        """Check if we should send the reminder"""
        # We check if current time is equal to or greater than scheduled time.
        # Since we run every minute, this ensures we don't miss it if we started a bit late.
        # Repeated sending is preventing by last_sent_at check in the main loop.

        # Ensure comparison is done on naive times (wall clock time vs wall clock time)
        if scheduled.tzinfo is not None:
            scheduled = scheduled.replace(tzinfo=None)

        if current.tzinfo is not None:
            current = current.replace(tzinfo=None)

        # Simple comparison for same day
        if current >= scheduled:
            return True
        return False
