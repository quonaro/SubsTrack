from tortoise.models import Model
from tortoise import fields


class User(Model):
    """User model for storing Telegram user data"""
    id = fields.IntField(pk=True)
    telegram_id = fields.BigIntField(unique=True, index=True, description="Telegram user ID")
    username = fields.CharField(max_length=255, null=True, description="Telegram username")
    first_name = fields.CharField(max_length=255, null=True, description="User's first name")
    last_name = fields.CharField(max_length=255, null=True, description="User's last name")
    language_code = fields.CharField(max_length=10, null=True, description="User's language code")
    is_bot = fields.BooleanField(default=False, description="Whether the user is a bot")
    is_premium = fields.BooleanField(default=False, description="Whether the user has Telegram Premium")
    created_at = fields.DatetimeField(auto_now_add=True, description="Account creation timestamp")
    updated_at = fields.DatetimeField(auto_now=True, description="Last update timestamp")

    class Meta:
        table = "users"

    def __str__(self) -> str:
        return f"User({self.telegram_id}, {self.username or self.first_name})"









