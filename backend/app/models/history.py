from tortoise.models import Model
from tortoise import fields


class History(Model):
    """Model for tracking subscription history and audit logs"""

    id = fields.IntField(pk=True)
    subscription = fields.ForeignKeyField(
        "models.Subscription",
        related_name="history",
        description="Related subscription",
    )
    event_type = fields.CharField(
        max_length=50,
        description="Type of event (created, updated, payment, archived, etc.)",
    )
    details = fields.JSONField(
        description="Detailed changes or metadata about the event", null=True
    )
    created_at = fields.DatetimeField(
        auto_now_add=True, description="Timestamp of the event"
    )

    class Meta:
        table = "history"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"History({self.event_type} for {self.subscription_id})"
