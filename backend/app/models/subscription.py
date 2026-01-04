from tortoise.models import Model
from tortoise import fields


class Subscription(Model):
    """Subscription model for tracking user subscriptions"""

    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.User",
        related_name="subscriptions",
        description="User who owns this subscription",
    )
    name = fields.CharField(max_length=255, description="Subscription name")
    price = fields.DecimalField(
        max_digits=10, decimal_places=2, description="Subscription price"
    )
    currency = fields.CharField(
        max_length=10, default="RUB", description="Currency code"
    )
    period_days = fields.IntField(description="Billing period in days")
    start_date = fields.DateField(description="Initial payment date anchor")
    next_payment_date = fields.DateField(description="Next scheduled payment date")
    icon = fields.CharField(max_length=10, default="📦", description="Emoji icon")
    is_active = fields.BooleanField(
        default=True, description="Whether subscription is active"
    )
    reminder_enabled = fields.BooleanField(
        default=True, description="Whether reminders are enabled"
    )
    category = fields.ForeignKeyField(
        "models.Category",
        related_name="subscriptions",
        null=True,
        description="Subscription category",
    )
    created_at = fields.DatetimeField(
        auto_now_add=True, description="Creation timestamp"
    )
    updated_at = fields.DatetimeField(
        auto_now=True, description="Last update timestamp"
    )

    class Meta:
        table = "subscriptions"
        indexes = [("user", "is_active")]

    def __str__(self) -> str:
        return f"Subscription({self.name}, {self.price} {self.currency})"
