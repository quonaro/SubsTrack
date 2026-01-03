from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schema.category import CategoryResponse
from enum import Enum


class NotificationRuleType(str, Enum):
    BEFORE_PAYMENT = "before_payment"
    RECURRING_NAG = "recurring_nag"
    DAY_OF_PAYMENT = "day_of_payment"
    DUE_DATE_AGGRESSIVE = "due_date_aggressive"
    WEEKLY_DIGEST = "weekly_digest"


class NotificationRuleBase(BaseModel):
    rule_type: NotificationRuleType
    days_before: Optional[int] = None
    hours_before: Optional[int] = None
    at_time: Optional[str] = None  # HH:MM format
    interval_hours: Optional[int] = None


class NotificationRuleCreate(NotificationRuleBase):
    pass


class NotificationRuleResponse(NotificationRuleBase):
    id: int
    last_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    """Schema for creating a subscription"""

    name: str = Field(
        ..., min_length=1, max_length=255, description="Subscription name"
    )
    price: float = Field(..., ge=0, description="Subscription price")
    currency: str = Field(default="RUB", max_length=10, description="Currency code")
    period_days: int = Field(..., gt=0, description="Billing period in days")
    start_date: datetime = Field(..., description="Initial payment date anchor")
    next_payment_date: datetime = Field(..., description="Next scheduled payment date")
    icon: str = Field(default="📦", max_length=10, description="Emoji icon")
    reminder_enabled: bool = Field(
        default=True, description="Whether reminders are enabled"
    )
    reminder_days_before: int = Field(
        default=1, ge=0, description="Days before payment to send reminder"
    )
    category_id: Optional[int] = Field(None, description="Category ID")
    notification_rules: Optional[list[NotificationRuleCreate]] = Field(
        default=[], description="List of notification rules"
    )


class SubscriptionUpdate(BaseModel):
    """Schema for updating a subscription"""

    name: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Subscription name"
    )
    price: Optional[float] = Field(None, ge=0, description="Subscription price")
    currency: Optional[str] = Field(None, max_length=10, description="Currency code")
    period_days: Optional[int] = Field(None, gt=0, description="Billing period in days")
    start_date: Optional[datetime] = Field(
        None, description="Initial payment date anchor"
    )
    next_payment_date: Optional[datetime] = Field(
        None, description="Next scheduled payment date"
    )
    icon: Optional[str] = Field(None, max_length=10, description="Emoji icon")
    is_active: Optional[bool] = Field(
        None, description="Whether subscription is active"
    )
    reminder_enabled: Optional[bool] = Field(
        None, description="Whether reminders are enabled"
    )
    reminder_days_before: Optional[int] = Field(
        None, ge=0, description="Days before payment to send reminder"
    )
    category_id: Optional[int] = Field(None, description="Category ID")
    notification_rules: Optional[list[NotificationRuleCreate]] = Field(
        None, description="List of notification rules"
    )


class SubscriptionResponse(BaseModel):
    """Schema for subscription response"""

    id: int
    user_id: int
    name: str
    price: float
    currency: str
    period_days: int
    start_date: datetime
    next_payment_date: datetime
    icon: str
    is_active: bool
    reminder_enabled: bool
    reminder_days_before: int
    category: Optional[CategoryResponse] = None
    notification_rules: list[NotificationRuleResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NextMonthTotalResponse(BaseModel):
    """Schema for next month total response"""

    total: float
    currency: str
    count: int


class SubscriptionOccurrence(BaseModel):
    """Schema for subscription occurrence on calendar"""

    date: datetime
    subscription: SubscriptionResponse
