from tortoise.models import Model
from tortoise import fields
from enum import StrEnum


class NotificationRuleType(StrEnum):
    ADVANCE_NOTICE = "advance_notice"  # X days/hours before
    RECURRING_REMINDER = "recurring_reminder"  # Every X hours until paid
    PAYMENT_DAY_ALERT = "payment_day_alert"  # Morning of payment day
    URGENT_REMINDER = "urgent_reminder"  # Every hour evening of payment day
    WEEKLY_SUMMARY = "weekly_summary"  # Weekly summary


class NotificationRule(Model):
    """Granular rules for subscription notifications"""

    id = fields.IntField(pk=True)
    subscription = fields.ForeignKeyField(
        "models.Subscription", related_name="notification_rules"
    )
    rule_type = fields.CharEnumField(NotificationRuleType)

    # Configuration based on type
    days_before = fields.IntField(
        null=True, description="Days before payment (for BEFORE_PAYMENT)"
    )
    hours_before = fields.IntField(
        null=True, description="Hours before payment (for BEFORE_PAYMENT/RECURRING_NAG)"
    )
    at_time = fields.TimeField(
        null=True, description="Specific time of day for notification"
    )
    interval_hours = fields.IntField(
        null=True, description="Interval for recurring notifications"
    )

    last_sent_at = fields.DatetimeField(
        null=True, description="Timestamp of last sent notification for this rule"
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "notification_rules"
        indexes = [("subscription_id", "rule_type")]

    def __str__(self) -> str:
        return f"NotificationRule({self.rule_type} for {self.subscription_id})"
