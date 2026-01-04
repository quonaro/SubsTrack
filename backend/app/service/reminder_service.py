from app.repository.subscription_repository import SubscriptionRepository
from app.models.subscription import Subscription
from app.models.notification_rule import NotificationRuleType
from config import settings
import asyncio
from datetime import datetime, timedelta, time
import httpx


class ReminderService:
    """Service for sending subscription reminders via Telegram bot using granular rules"""

    def __init__(self):
        self.repository = SubscriptionRepository()
        self.bot_token = settings.telegram_bot_token
        self.api_url = "https://api.telegram.org/bot"

    async def send_reminder(
        self, subscription: Subscription, rule_type: str = "reminder"
    ) -> bool:
        """
        Send reminder message to user via Telegram bot
        """
        if not self.bot_token:
            return False

        if settings.dev and not subscription.user.is_admin:
            return False

        try:
            now = datetime.now()
            days_until = (subscription.next_payment_date - now.date()).days

            # Format message
            header = "🔔 Уведомление о подписке"
            if rule_type == NotificationRuleType.RECURRING_REMINDER:
                header = "⚠️ ПОВТОРНОЕ НАПОМИНАНИЕ"
            elif rule_type == NotificationRuleType.URGENT_REMINDER:
                header = "‼️ СРОЧНОЕ УВЕДОМЛЕНИЕ"

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

            # Send message via Telegram Bot API
            url = f"{self.api_url}{self.bot_token}/sendMessage"
            payload = {"chat_id": subscription.user.telegram_id, "text": message}

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                return response.status_code == 200

        except Exception as e:
            print(f"Error sending reminder: {e}")
            return False

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
            user_now = server_now.astimezone(user_tz)
            today = user_now.date()
            current_time = user_now.time()

            for rule in sub.notification_rules:
                should_trigger = False

                # Check if already sent recently to avoid spam (within same hour at least)
                # We use server time for last_sent_at check as it is stored in UTC (or naive assumed UTC)
                # Ideally last_sent_at should be timezone aware. If it's naive, we treat it as UTC.
                if rule.last_sent_at:
                    last_sent = rule.last_sent_at
                    if last_sent.tzinfo is None:
                        last_sent = pytz.UTC.localize(last_sent)

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
                            # We need to check if multiple sends happened today in user's timezone?
                            # Simplest is check if last_sent_at was today
                            if not rule.last_sent_at:
                                should_trigger = True
                            else:
                                last_sent = rule.last_sent_at
                                if last_sent.tzinfo is None:
                                    last_sent = pytz.UTC.localize(last_sent)
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
                            last_sent = rule.last_sent_at
                            if last_sent.tzinfo is None:
                                last_sent = pytz.UTC.localize(last_sent)
                            # Compare using server time (UTC)
                            if (server_now - last_sent) >= timedelta(hours=interval):
                                should_trigger = True

                elif rule.rule_type == NotificationRuleType.PAYMENT_DAY_ALERT:
                    if today == sub.next_payment_date:
                        at_time = rule.at_time or time(9, 0)  # Default 9 AM
                        if self._is_time_to_send(at_time, current_time):
                            should_trigger = True

                elif rule.rule_type == NotificationRuleType.SINGLE_REMINDER:
                    if today == sub.next_payment_date:
                        if rule.at_time and self._is_time_to_send(
                            rule.at_time, current_time
                        ):
                            should_trigger = True

                elif rule.rule_type == NotificationRuleType.URGENT_REMINDER:
                    # This rule might be deprecated or not in enum based on previous search results
                    # But if it exists in DB/Code, let's keep it safe.
                    # Assuming logic: send every hour after 6 PM on payment day
                    if today == sub.next_payment_date and user_now.hour >= 18:
                        if not rule.last_sent_at:
                            should_trigger = True
                        else:
                            last_sent = rule.last_sent_at
                            if last_sent.tzinfo is None:
                                last_sent = pytz.UTC.localize(last_sent)
                            if (server_now - last_sent) >= timedelta(hours=1):
                                should_trigger = True

                if should_trigger:
                    success = await self.send_reminder(sub, rule.rule_type)
                    if success:
                        rule.last_sent_at = server_now.replace(
                            tzinfo=None
                        )  # Store as naive UTC if DB expects naive
                        await rule.save()
                        sent_count += 1
                        await asyncio.sleep(0.1)

        return sent_count

    def _is_time_to_send(self, scheduled: time, current: time) -> bool:
        """Check if current time is within 1 hour after scheduled time"""
        # We check if current hour == scheduled hour.
        # This works if job runs every hour or more frequently.
        if current.hour == scheduled.hour:
            return True
        return False
