from pydantic import BaseModel
from typing import List
from .subscription import SubscriptionResponse

class StatisticsResponse(BaseModel):
    total_monthly: float
    total_yearly: float
    active_count: int
    inactive_count: int
    top_subscriptions: List[SubscriptionResponse]
    currency: str = "RUB"
