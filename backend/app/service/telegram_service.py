import httpx
from config import settings
import logging

logger = logging.getLogger(__name__)


class TelegramService:
    """Service to interact with Telegram Bot API"""

    def __init__(self):
        self.bot_token = settings.telegram_bot_token
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_message(self, chat_id: int, text: str) -> bool:
        """Send a message to a specific chat ID"""
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not set, skipping notification")
            return False

        url = f"{self.base_url}/sendMessage"
        payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code != 200:
                    logger.error(
                        f"Failed to send Telegram message to chat_id {chat_id}. Status: {response.status_code}, Body: {response.text}"
                    )
                    return False
                logger.info(f"Successfully sent Telegram message to chat_id {chat_id}")
                return True
        except httpx.TimeoutException:
            logger.error(f"Timeout while sending Telegram message to chat_id {chat_id}")
            return False
        except Exception:
            logger.exception(
                f"Unexpected error sending Telegram message to chat_id {chat_id}"
            )
            return False

    async def send_reminder(
        self,
        telegram_id: int,
        sub_name: str,
        price: float,
        currency: str,
        days_before: int,
    ):
        """Send a subscription reminder"""
        msg = (
            f"🔔 <b>Напоминание о подписке!</b>\n\n"
            f"Подписка: <b>{sub_name}</b>\n"
            f"Сумма: <b>{price} {currency}</b>\n"
            f"Через <b>{days_before}</b> дн."
        )
        return await self.send_message(telegram_id, msg)

    async def send_document(
        self, chat_id: int, file_content: bytes, filename: str, caption: str = None
    ) -> bool:
        """Send a document (file) to a specific chat ID"""
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not set, skipping document sending")
            return False

        url = f"{self.base_url}/sendDocument"

        files = {"document": (filename, file_content)}
        data = {"chat_id": chat_id}
        if caption:
            data["caption"] = caption
            data["parse_mode"] = "HTML"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, files=files, timeout=20.0)
                if response.status_code != 200:
                    logger.error(
                        f"Failed to send Telegram document to chat_id {chat_id}. Status: {response.status_code}, Body: {response.text}"
                    )
                    return False
                logger.info(f"Successfully sent Telegram document to chat_id {chat_id}")
                return True
        except httpx.TimeoutException:
            logger.error(
                f"Timeout while sending Telegram document to chat_id {chat_id}"
            )
            return False
        except Exception:
            logger.exception(
                f"Unexpected error sending Telegram document to chat_id {chat_id}"
            )
            return False
