from tortoise.models import Model
from tortoise import fields


class Category(Model):
    """Category model for grouping subscriptions"""

    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(
        "models.User",
        related_name="categories",
        description="User who owns this category",
    )
    name = fields.CharField(max_length=50, description="Category name")
    color = fields.CharField(
        max_length=20, default="#8b5cf6", description="Category color hex code"
    )
    icon = fields.CharField(
        max_length=10, default="📁", description="Category emoji icon"
    )
    created_at = fields.DatetimeField(
        auto_now_add=True, description="Creation timestamp"
    )

    class Meta:
        table = "categories"
        unique_together = (("user", "name"),)
        indexes = [("user", "name")]

    def __str__(self) -> str:
        return f"{self.name} (User: {self.user_id})"
