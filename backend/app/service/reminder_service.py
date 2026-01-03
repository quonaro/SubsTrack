from app.repository.subscription_repository import SubscriptionRepository
from app.models.subscription import Subscription
from app.models.notification_log import NotificationLog
from config import settings
import asyncio
from datetime import datetime
import httpx


class ReminderService:
    """Service for sending subscription reminders via Telegram bot"""

    def __init__(self):
        self.repository = SubscriptionRepository()
        self.bot_token = settings.telegram_bot_token
        self.api_url = "https://api.telegram.org/bot"

    async def send_reminder(self, subscription: Subscription) -> bool:
        """
        Send reminder message to user via Telegram bot using direct HTTP request
        """
        if not self.bot_token:
            print("Warning: Telegram bot token not configured, skipping reminder")
            return False

        try:
            # Format message
            days_until = (subscription.next_payment_date - datetime.now()).days
            message = (
                f"🔔 Напоминание о подписке\n\n"
                f"{subscription.icon} {subscription.name}\n"
                f"💰 {subscription.price} {subscription.currency}\n"
                f"📅 Платеж через {days_until} {'день' if days_until == 1 else 'дня' if days_until < 5 else 'дней'}\n"
                f"📆 Дата платежа: {subscription.next_payment_date.strftime('%d.%m.%Y')}"
            )

            # Send message via Telegram Bot API
            url = f"{self.api_url}{self.bot_token}/sendMessage"
            payload = {
                "chat_id": subscription.user.telegram_id,
                "text": message
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                
                if result.get("ok"):
                    return True
                else:
                    print(f"Telegram API error: {result.get('description')}")
                    return False
            
        except httpx.HTTPError as e:
            print(f"HTTP error sending reminder to user {subscription.user.telegram_id}: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error sending reminder: {e}")
            return False

    async def check_and_send_reminders(self, days_before: int = 1) -> int:
        """
        Check subscriptions that need reminders and send them
        Returns number of reminders sent
        """
        subscriptions = await self.repository.get_subscriptions_for_reminder(days_before)
        
        sent_count = 0
        for subscription in subscriptions:
            # Check if reminder already sent today
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            existing_log = await NotificationLog.filter(
                subscription=subscription,
                type='reminder',
                sent_at__gte=today_start
            ).first()

            if existing_log:
                continue

            success = await self.send_reminder(subscription)
            if success:
                # Log the notification
                await NotificationLog.create(
                    subscription=subscription,
                    type='reminder'
                )
                sent_count += 1
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.1)
        
        return sent_count

    async def send_reminder_for_subscription(self, subscription_id: int, user_id: int) -> bool:
        """
        Send reminder for specific subscription
        """
        subscription = await self.repository.get_by_id(subscription_id, user_id)
        if not subscription:
            return False
        
        if not subscription.reminder_enabled or not subscription.is_active:
            return False
        
        return await self.send_reminder(subscription)

