from tortoise.models import Model
from tortoise import fields

class Category(Model):
    """Category model for grouping subscriptions"""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50, unique=True, description="Category name")
    color = fields.CharField(max_length=20, default="#8b5cf6", description="Category color hex code")
    icon = fields.CharField(max_length=10, default="📁", description="Category emoji icon")
    created_at = fields.DatetimeField(auto_now_add=True, description="Creation timestamp")

    class Meta:
        table = "categories"

    def __str__(self) -> str:
        return self.name
