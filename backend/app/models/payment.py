from tortoise.models import Model
from tortoise import fields

class PaymentHistory(Model):
    """Model for tracking subscription payment history"""
    id = fields.IntField(pk=True)
    subscription = fields.ForeignKeyField('models.Subscription', related_name='payments', description="Subscription")
    amount = fields.DecimalField(max_digits=10, decimal_places=2, description="Payment amount")
    currency = fields.CharField(max_length=10, default='RUB', description="Currency")
    date = fields.DateField(description="Payment date")
    created_at = fields.DatetimeField(auto_now_add=True, description="Record creation timestamp")

    class Meta:
        table = "payment_history"
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"Payment({self.amount} {self.currency} on {self.date})"
