import httpx
from config import settings
import logging

import asyncio

logger = logging.getLogger(__name__)


class TelegramService:
    """Service to interact with Telegram Bot API"""

    def __init__(self):
        self.bot_token = settings.telegram_bot_token
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def _request_with_retry(self, method, url, **kwargs):
        """Helper to perform requests with retry logic"""
        max_retries = 3
        base_delay = 1

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.request(method, url, **kwargs)

                    if response.status_code == 429:  # Too Many Requests
                        retry_after = int(
                            response.headers.get("Retry-After", base_delay)
                        )
                        logger.warning(
                            f"Telegram rate limit hit. Retrying after {retry_after}s..."
                        )
                        await asyncio.sleep(retry_after)
                        continue

                    if 500 <= response.status_code < 600:
                        raise httpx.HTTPStatusError(
                            "Server error", request=None, response=response
                        )

                    return response
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                if attempt == max_retries - 1:
                    raise e

                delay = base_delay * (2**attempt)
                logger.warning(
                    f"Request failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
        return None

    async def send_message(
        self, chat_id: int, text: str, reply_markup: dict = None
    ) -> bool:
        """Send a message to a specific chat ID"""
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not set, skipping notification")
            return False

        url = f"{self.base_url}/sendMessage"
        payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
        if reply_markup:
            import json

            payload["reply_markup"] = json.dumps(reply_markup)

        try:
            response = await self._request_with_retry("POST", url, json=payload)

            if response.status_code != 200:
                logger.error(
                    f"Failed to send Telegram message to chat_id {chat_id}. Status: {response.status_code}, Body: {response.text}"
                )
                return False

            logger.info(f"Successfully sent Telegram message to chat_id {chat_id}")
            return True

        except Exception:
            logger.exception(
                f"Unexpected error sending Telegram message to chat_id {chat_id}"
            )
            return False

    async def answer_callback_query(
        self, callback_query_id: str, text: str = None
    ) -> bool:
        """Answer a callback query to stop the loading state on the bot"""
        if not self.bot_token:
            return False

        url = f"{self.base_url}/answerCallbackQuery"
        payload = {"callback_query_id": callback_query_id}
        if text:
            payload["text"] = text

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=5.0)
                return response.status_code == 200
        except Exception:
            logger.exception(f"Error answering callback query {callback_query_id}")
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
            # Note: Multipart uploads are more complex to retry with the simple helper
            # because logic splits arguments. For now keeping simple retry or just standard call.
            # But let's apply partial retry logic manually or just rely on the simpler one above
            # For file uploads, we generally want to be careful with retries to not upload multiple times if first one actually succeeded but we got timeout on read.
            # So will leave this one simple for now, or just basic try/except.

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, data=data, files=files, timeout=40.0
                )  # Increased timeout for files
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
