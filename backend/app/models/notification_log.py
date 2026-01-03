from tortoise.models import Model
from tortoise import fields

class NotificationLog(Model):
    """Log of sent notifications to prevent duplicates"""
    id = fields.IntField(pk=True)
    subscription = fields.ForeignKeyField('models.Subscription', related_name='notifications')
    sent_at = fields.DatetimeField(auto_now_add=True)
    type = fields.CharField(max_length=50, default='reminder')

    class Meta:
        table = "notification_logs"
        indexes = [("subscription_id", "sent_at")]
